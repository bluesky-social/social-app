import {type BlobRef} from '@atproto/lex'
import {describe, expect, jest, test} from '@jest/globals'

/* Avoid loading the UI module chain through the real link resolver. */
jest.mock('#/lib/api/resolve', () => {
  class EmbeddingDisabledError extends Error {}
  return {resolveLink: jest.fn(), EmbeddingDisabledError}
})

import {type LinkResolvers} from '#/lib/api/resolve'
import {createVideoTelemetry} from '#/lib/media/video/telemetry'
import {type CompressedVideo} from '#/lib/media/video/types'
import {type ComposerV2Plan} from '#/components/ComposerV2/planner'
import {createThreadStore} from '#/components/ComposerV2/store'
import {
  fakeAnalytics,
  realUploadWorkers,
  testUploadRuntime,
} from '#/components/ComposerV2/store/__tests__/uploadTestUtils'
import {type PostMediaVideo} from '#/components/ComposerV2/store/types'
import {type VideoUploadDependencies} from '#/components/ComposerV2/store/uploads'
import {getMediaItems} from '#/components/ComposerV2/store/utils/getMediaItems'

const resolvers = {} as LinkResolvers

const videoBlob = {
  $type: 'blob',
  ref: {$link: 'video'},
  mimeType: 'video/mp4',
  size: 1,
} as unknown as BlobRef

const source = {
  uri: 'file:///tmp/a.mp4',
  width: 1920,
  height: 1080,
  mimeType: 'video/mp4',
  fileSize: 2048,
  duration: 3,
}

const compressed: CompressedVideo = {
  uri: 'file:///tmp/a-compressed.mp4',
  size: 1024,
  mimeType: 'video/mp4',
}

function makeIdGenerator() {
  let i = 0
  return () => `id-${++i}`
}

/** A promise a test settles, for holding a worker at one phase. */
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return {promise, resolve, reject}
}

function flush() {
  return new Promise(resolve => setTimeout(resolve, 0))
}

/**
 * A store running the real video worker and real telemetry. Defaults
 * complete in one step: no compression probe, and an upload that returns an
 * already finished job.
 */
function makeStore(video: Partial<VideoUploadDependencies> = {}) {
  const {metric, analytics} = fakeAnalytics()
  const store = createThreadStore({
    ...testUploadRuntime,
    analytics,
    resolvers,
    __createId: makeIdGenerator(),
    __uploadWorkers: realUploadWorkers({
      video: {
        createVideoTelemetry,
        getVideoMetadata: () => Promise.resolve(source),
        compressVideo: () => Promise.resolve(compressed),
        uploadVideo: () =>
          Promise.resolve({
            state: 'JOB_STATE_COMPLETED',
            jobId: 'job-1',
            blob: videoBlob,
          } as never),
        ...video,
      },
    }),
  })
  const postId = Object.keys(store.getState().posts)[0]
  return {
    store,
    postId,
    /** Event names in emission order. */
    events: () => metric.mock.calls.map(([event]) => event),
    payload: (event: string) =>
      metric.mock.calls.find(([name]) => name === event)?.[1],
    addVideo(captions?: Array<{lang: string; content: string}>) {
      const input = {kind: 'video' as const, uri: source.uri, captions}
      return store.actions.addMedia(postId, [input])!.addedMediaIds[0]
    },
    video(mediaId: string) {
      return getMediaItems({
        media: store.getState().posts[postId].attachments.media,
      }).find(item => item.id === mediaId) as PostMediaVideo
    },
  }
}

/** A plan whose only post record carries `embed`, as a write would. */
function planEmbedding({
  postId,
  embed,
}: {
  postId: string
  embed: unknown
}): ComposerV2Plan {
  return {
    posts: [{postId, record: {embed}}],
  } as unknown as ComposerV2Plan
}

const fullFunnel = [
  'video:upload:picked',
  'video:upload:compressStarted',
  'video:upload:compressCompleted',
  'video:upload:uploadStarted',
  'video:upload:uploadCompleted',
  'video:upload:processingStarted',
  'video:upload:processingCompleted',
]

describe('ComposerV2 video telemetry', () => {
  test('records the existing composer funnel, ending in publication', async () => {
    const harness = makeStore({
      compressVideo: (_asset, opts) => {
        opts?.onProbe?.({
          durationMs: 3000,
          width: 1920,
          height: 1080,
          bitrate: 1000,
          frameRate: 30,
        } as never)
        return Promise.resolve(compressed)
      },
    })
    const mediaId = harness.addVideo()
    await flush()

    expect(harness.video(mediaId).upload.state).toBe('uploaded')
    expect(harness.events()).toEqual([
      'video:upload:picked',
      'video:upload:compressStarted',
      'video:upload:probed',
      ...fullFunnel.slice(2),
    ])
    /* Source metadata comes from worker preparation, not the input. */
    expect(harness.payload('video:upload:picked')).toMatchObject({
      sourceMimeType: 'video/mp4',
      sourceBytes: 2048,
      sourceWidth: 1920,
      sourceHeight: 1080,
    })

    harness.store.reportPublished({
      plan: planEmbedding({
        postId: harness.postId,
        embed: {$type: 'app.bsky.embed.video', video: videoBlob},
      }),
    })
    expect(harness.events().at(-1)).toBe('video:upload:published')
    const picked = harness.payload('video:upload:picked') as {uploadId: string}
    expect(harness.payload('video:upload:published')).toMatchObject({
      uploadId: picked.uploadId,
    })
  })

  test('records a compression passthrough as skipped', async () => {
    const harness = makeStore({
      compressVideo: () =>
        Promise.resolve({...compressed, passthroughReason: 'gif'}),
    })
    harness.addVideo()
    await flush()

    expect(harness.events()).toContain('video:upload:compressSkipped')
    expect(harness.events()).not.toContain('video:upload:compressCompleted')
    expect(harness.payload('video:upload:compressSkipped')).toMatchObject({
      skipReason: 'gif',
    })
  })

  test('records processing that finishes after polling', async () => {
    const harness = makeStore({
      uploadVideo: () =>
        Promise.resolve({
          state: 'JOB_STATE_ENCODING',
          jobId: 'job-1',
        } as never),
      createVideoServiceClient: (() => ({
        call: () =>
          Promise.resolve({
            jobStatus: {
              state: 'JOB_STATE_COMPLETED',
              jobId: 'job-1',
              blob: videoBlob,
            },
          }),
      })) as never,
      sleep: () => Promise.resolve(),
    })
    harness.addVideo()
    await flush()

    expect(harness.events()).toEqual(fullFunnel)
    expect(harness.payload('video:upload:processingStarted')).toMatchObject({
      jobId: 'job-1',
    })
  })

  const failures = [
    {
      stage: 'compression',
      event: 'video:upload:compressFailed',
      video: {
        compressVideo: () => Promise.reject(new Error('compress failed')),
      },
    },
    {
      stage: 'upload',
      event: 'video:upload:uploadFailed',
      video: {uploadVideo: () => Promise.reject(new Error('upload failed'))},
    },
    {
      stage: 'an oversized output',
      event: 'video:upload:uploadFailed',
      video: {
        compressVideo: () =>
          Promise.resolve({...compressed, size: Number.MAX_SAFE_INTEGER}),
      },
    },
    {
      stage: 'processing',
      event: 'video:upload:processingFailed',
      video: {
        uploadVideo: () =>
          Promise.resolve({
            state: 'JOB_STATE_FAILED',
            jobId: 'job-1',
            error: 'bad video',
          }),
      },
    },
  ] as const
  test.each(failures)('$stage fails once as $event', async ({event, video}) => {
    const harness = makeStore(video as Partial<VideoUploadDependencies>)
    const mediaId = harness.addVideo()
    await flush()

    expect(harness.video(mediaId).upload.state).toBe('failed')
    const failed = harness.events().filter(name => name.endsWith('Failed'))
    expect(failed).toEqual([event])
  })

  test('a source that fails validation is picked but never compressed', async () => {
    const harness = makeStore({
      getVideoMetadata: () =>
        Promise.resolve({...source, duration: Number.MAX_SAFE_INTEGER}),
    })
    const mediaId = harness.addVideo()
    await flush()

    expect(harness.video(mediaId).upload.state).toBe('failed')
    expect(harness.events()).toEqual(['video:upload:picked'])
  })

  test.each([
    {
      action: 'removing the video',
      remove: (h: ReturnType<typeof makeStore>, mediaId: string) =>
        h.store.actions.removeMedia(h.postId, mediaId),
    },
    {
      action: 'clearing the attachment',
      remove: (h: ReturnType<typeof makeStore>) =>
        h.store.actions.removeMediaAttachment(h.postId),
    },
    {
      action: 'removing its post',
      remove: (h: ReturnType<typeof makeStore>) => {
        h.store.actions.addPost('after', h.postId)
        h.store.actions.removePost(h.postId)
      },
    },
  ])('$action abandons an in-flight upload', async ({remove}) => {
    const upload = deferred<never>()
    const harness = makeStore({uploadVideo: () => upload.promise})
    const mediaId = harness.addVideo()
    await flush()

    remove(harness, mediaId)
    await flush()

    expect(harness.events().at(-1)).toBe('video:upload:abandoned')
    expect(harness.payload('video:upload:abandoned')).toMatchObject({
      phase: 'upload',
    })
  })

  test('cancellations the user did not ask for are not abandonment', async () => {
    const upload = deferred<never>()
    const harness = makeStore({uploadVideo: () => upload.promise})
    const mediaId = harness.addVideo()
    await flush()

    /* Editing captions restarts the upload; teardown discards it. */
    harness.store.actions.setVideoCaptions(harness.postId, mediaId, [
      {lang: 'en', content: 'WEBVTT'},
    ])
    await flush()
    harness.store.destroy()
    await flush()

    expect(harness.events()).not.toContain('video:upload:abandoned')
    /* The restart is a new upload attempt with its own funnel. */
    const picks = harness.events().filter(name => name.endsWith(':picked'))
    expect(picks).toHaveLength(2)
  })

  test('a caption-only retry reuses the uploaded video and its telemetry', async () => {
    const uploadBlob = jest.fn<VideoUploadDependencies['uploadBlob']>()
    uploadBlob.mockRejectedValueOnce(new Error('caption failed'))
    uploadBlob.mockResolvedValue({blob: videoBlob})
    const harness = makeStore({uploadBlob})
    const mediaId = harness.addVideo([{lang: 'en', content: 'WEBVTT'}])
    await flush()
    expect(harness.video(mediaId).upload.state).toBe('failed')

    harness.store.actions.retryMediaUpload(harness.postId, mediaId)
    await flush()
    expect(harness.video(mediaId).upload.state).toBe('uploaded')
    expect(harness.events()).toEqual(fullFunnel)

    harness.store.reportPublished({
      plan: planEmbedding({
        postId: harness.postId,
        embed: {$type: 'app.bsky.embed.video', video: videoBlob},
      }),
    })
    expect(harness.events().at(-1)).toBe('video:upload:published')
  })

  test('publication matches the embedded blob, reporting each video once', async () => {
    const harness = makeStore()
    harness.addVideo()
    await flush()
    const other = {...videoBlob}

    harness.store.reportPublished({
      plan: planEmbedding({
        postId: harness.postId,
        embed: {$type: 'app.bsky.embed.video', video: other},
      }),
    })
    expect(harness.events()).not.toContain('video:upload:published')

    const withQuote = planEmbedding({
      postId: harness.postId,
      embed: {
        $type: 'app.bsky.embed.recordWithMedia',
        record: {},
        media: {$type: 'app.bsky.embed.video', video: videoBlob},
      },
    })
    harness.store.reportPublished({plan: withQuote})
    harness.store.reportPublished({plan: withQuote})
    const published = harness
      .events()
      .filter(name => name === 'video:upload:published')
    expect(published).toHaveLength(1)
  })

  test('publication is reported after the store is destroyed', async () => {
    const harness = makeStore()
    harness.addVideo()
    await flush()
    harness.store.destroy()

    harness.store.reportPublished({
      plan: planEmbedding({
        postId: harness.postId,
        embed: {$type: 'app.bsky.embed.video', video: videoBlob},
      }),
    })
    expect(harness.events().at(-1)).toBe('video:upload:published')
  })
})
