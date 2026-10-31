import {type BlobRef} from '@atproto/lex'
import {afterEach, describe, expect, jest, test} from '@jest/globals'

let mockIsWeb = false
let mockIsAndroid = false

jest.mock('#/env', () =>
  /* Getters keep the flags live; object spread would copy their values. */
  Object.defineProperties(
    {...jest.requireActual<object>('#/env')},
    {
      IS_WEB: {get: () => mockIsWeb},
      IS_ANDROID: {get: () => mockIsAndroid},
    },
  ),
)
/* Avoid loading the UI module chain through the real link resolver. */
jest.mock('#/lib/api/resolve', () => {
  class EmbeddingDisabledError extends Error {}
  return {resolveLink: jest.fn(), EmbeddingDisabledError}
})

import {type LinkResolvers} from '#/lib/api/resolve'
import {AbortError} from '#/lib/async/cancelable'
import {VideoTooLargeError} from '#/lib/media/video/errors'
import {createVideoTelemetry} from '#/lib/media/video/telemetry'
import {type CompressedVideo} from '#/lib/media/video/types'
import {type ComposerV2Plan} from '#/components/ComposerV2/planner'
import {createThreadStore} from '#/components/ComposerV2/store'
import {
  completedJobClient,
  fakeAnalytics,
  fakeUploadAttempt,
  fakeVideoDependencies,
  realUploadWorkers,
  testUploadRuntime,
} from '#/components/ComposerV2/store/__tests__/uploadTestUtils'
import {type PostMediaVideo} from '#/components/ComposerV2/store/types'
import {
  startVideoUpload,
  type VideoUploadAttempt,
  type VideoUploadDependencies,
} from '#/components/ComposerV2/store/uploads'
import {getMediaItems} from '#/components/ComposerV2/store/utils/getMediaItems'

/*
 * Reuse of a completed compression result, and of a processed video blob while
 * captions upload. The real video worker and telemetry run with fake platform
 * dependencies; nothing reaches the network.
 */

const resolvers = {} as LinkResolvers

const videoBlob = {
  $type: 'blob',
  ref: {$link: 'video'},
  mimeType: 'video/mp4',
  size: 1,
} as unknown as BlobRef

const captionBlob = (name: string) =>
  ({
    $type: 'blob',
    ref: {$link: name},
    mimeType: 'text/vtt',
    size: 1,
  }) as unknown as BlobRef

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

const completedJob = {
  state: 'JOB_STATE_COMPLETED',
  jobId: 'job-1',
  blob: videoBlob,
} as never

function makeIdGenerator() {
  let i = 0
  return () => `id-${++i}`
}

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

/** Rejects with AbortError when the attempt is cancelled, like the real one. */
function pendingUntilAborted() {
  return jest.fn<VideoUploadDependencies['uploadVideo']>(
    ({signal}) =>
      new Promise((_, reject) => {
        signal.addEventListener('abort', () => reject(new AbortError()))
      }),
  )
}

function fakeCopy() {
  const released: string[] = []
  let count = 0
  const copyVideoToCache = jest.fn<VideoUploadDependencies['copyVideoToCache']>(
    () => {
      const uri = `file:///cache/copy-${++count}.mp4`
      return Promise.resolve({uri, release: () => released.push(uri)})
    },
  )
  return {copyVideoToCache, released}
}

/** Native file stat that reports every file as present at the given size. */
function presentFile(size = compressed.size) {
  return jest.fn<VideoUploadDependencies['getFileSize']>(() =>
    Promise.resolve(size),
  )
}

function makeStore(video: Partial<VideoUploadDependencies> = {}) {
  const {metric, analytics} = fakeAnalytics()
  const getVideoMetadata = jest.fn<VideoUploadDependencies['getVideoMetadata']>(
    () => Promise.resolve(source),
  )
  /* Overrides must be mocks so tests can inspect the worker's calls. */
  const compressVideo = (video.compressVideo ??
    jest.fn<VideoUploadDependencies['compressVideo']>(() =>
      Promise.resolve(compressed),
    )) as jest.MockedFunction<VideoUploadDependencies['compressVideo']>
  const uploadVideo = (video.uploadVideo ??
    jest.fn<VideoUploadDependencies['uploadVideo']>(() =>
      Promise.resolve(completedJob),
    )) as jest.MockedFunction<VideoUploadDependencies['uploadVideo']>
  const store = createThreadStore({
    defaultLanguages: [],
    ...testUploadRuntime,
    analytics,
    resolvers,
    __createId: makeIdGenerator(),
    __uploadWorkers: realUploadWorkers({
      video: {
        createVideoTelemetry,
        getVideoMetadata,
        getFileSize: presentFile(),
        createVideoServiceClient: completedJobClient({blob: videoBlob}),
        ...video,
        compressVideo,
        uploadVideo,
      },
    }),
  })
  const postId = Object.keys(store.getState().posts)[0]
  return {
    store,
    postId,
    getVideoMetadata,
    compressVideo,
    uploadVideo,
    events: () => metric.mock.calls.map(([event]) => event as string),
    payloads: (event: string) =>
      metric.mock.calls.filter(([name]) => name === event).map(call => call[1]),
    addVideo({
      captions,
      restored = false,
    }: {
      captions?: Array<{lang: string; content: string}>
      restored?: boolean
    } = {}) {
      const input = {
        kind: 'video' as const,
        uri: source.uri,
        captions,
        ...(restored && {mimeType: 'video/mp4', localRefPath: 'draft-video'}),
      }
      return store.actions.addMedia(postId, [input])!.addedMediaIds[0]
    },
    video(mediaId: string) {
      return getMediaItems({
        media: store.getState().posts[postId].attachments.media,
      }).find(item => item.id === mediaId) as PostMediaVideo
    },
    retry(mediaId: string) {
      store.actions.retryMediaUpload(postId, mediaId)
    },
  }
}

const failThenComplete = () =>
  jest
    .fn<VideoUploadDependencies['uploadVideo']>()
    .mockRejectedValueOnce(new Error('network'))
    .mockResolvedValue(completedJob)

/** A plan whose only post record carries `embed`, as a write would. */
function planEmbedding({postId}: {postId: string}): ComposerV2Plan {
  return {
    posts: [
      {
        postId,
        record: {embed: {$type: 'app.bsky.embed.video', video: videoBlob}},
      },
    ],
  } as unknown as ComposerV2Plan
}

afterEach(() => {
  mockIsWeb = false
  mockIsAndroid = false
})

describe('compression reuse after an upload failure', () => {
  test('a retry uploads the same compressed result without compressing again', async () => {
    const h = makeStore({uploadVideo: failThenComplete()})
    const mediaId = h.addVideo()
    await flush()
    expect(h.video(mediaId).upload).toMatchObject({
      state: 'failed',
      retryable: true,
    })
    const firstEvents = h.events().length
    const [first] = h.payloads('video:upload:picked') as Array<{
      uploadId: string
    }>

    h.retry(mediaId)
    await flush()

    expect(h.video(mediaId).upload.state).toBe('uploaded')
    expect(h.compressVideo).toHaveBeenCalledTimes(1)
    expect(h.getVideoMetadata).toHaveBeenCalledTimes(1)
    expect(h.uploadVideo).toHaveBeenCalledTimes(2)
    expect(h.uploadVideo.mock.calls[1][0].video).toBe(
      h.uploadVideo.mock.calls[0][0].video,
    )
    /* A linked new attempt with real transfer events, but no fake compression. */
    expect(h.events().slice(firstEvents)).toEqual([
      'video:upload:picked',
      'video:upload:restarted',
      'video:upload:uploadStarted',
      'video:upload:uploadCompleted',
      'video:upload:processingStarted',
      'video:upload:processingCompleted',
    ])
    const [restarted] = h.payloads('video:upload:restarted') as Array<{
      uploadId: string
      reason: string
      previousUploadId: string
    }>
    expect(restarted).toMatchObject({
      reason: 'retry',
      previousUploadId: first.uploadId,
    })
    expect(restarted.uploadId).not.toBe(first.uploadId)
    expect(h.payloads('video:upload:uploadStarted')[1]).toMatchObject({
      bytes: compressed.size,
    })

    /* Publication is attributed to the attempt that uploaded the blob. */
    h.store.reportPublished({plan: planEmbedding({postId: h.postId})})
    expect(h.payloads('video:upload:published')).toEqual([
      expect.objectContaining({uploadId: restarted.uploadId}),
    ])
    h.store.destroy()
  })

  test('a failure while processing the job is retried from the same output', async () => {
    const uploadVideo = jest
      .fn<VideoUploadDependencies['uploadVideo']>()
      .mockResolvedValueOnce({
        state: 'JOB_STATE_FAILED',
        jobId: 'job-1',
        error: 'bad video',
      } as never)
      .mockResolvedValue(completedJob)
    const h = makeStore({uploadVideo})
    const mediaId = h.addVideo()
    await flush()
    expect(h.video(mediaId).upload.state).toBe('failed')

    h.retry(mediaId)
    await flush()

    expect(h.video(mediaId).upload.state).toBe('uploaded')
    expect(h.compressVideo).toHaveBeenCalledTimes(1)
    h.store.destroy()
  })

  test('web keeps the compressed bytes out of state and uploads them intact on retry', async () => {
    mockIsWeb = true
    const bytes = new Uint8Array([1, 2, 3]).buffer
    const output: CompressedVideo = {
      uri: 'blob:original',
      size: bytes.byteLength,
      mimeType: 'video/mp4',
      bytes,
      passthroughReason: 'below-byte-threshold',
    }
    const getFileSize = presentFile()
    const h = makeStore({
      compressVideo: jest.fn(() => Promise.resolve(output)),
      getFileSize,
      uploadVideo: failThenComplete(),
    })
    const mediaId = h.addVideo()
    await flush()
    h.retry(mediaId)
    await flush()

    expect(h.video(mediaId).upload.state).toBe('uploaded')
    const retried = h.uploadVideo.mock.calls[1][0].video
    expect(retried).toBe(output)
    expect(retried.bytes).toBe(bytes)
    expect(retried.passthroughReason).toBe('below-byte-threshold')
    /* Bytes live in memory, so there is no file to stat. */
    expect(getFileSize).not.toHaveBeenCalled()
    expect(h.video(mediaId).prepared).not.toHaveProperty('bytes')
    expect(h.video(mediaId).prepared).not.toHaveProperty('uri')
    expect(h.video(mediaId).prepared).toMatchObject({
      size: bytes.byteLength,
      mimeType: 'video/mp4',
      width: 1920,
      height: 1080,
      aspectRatio: {width: 1920, height: 1080},
    })
    h.store.destroy()
  })

  test('native output that is gone falls back to one new compression', async () => {
    const getFileSize = jest
      .fn<VideoUploadDependencies['getFileSize']>()
      .mockRejectedValueOnce(new Error('missing'))
      .mockResolvedValue(compressed.size)
    const fresh = {...compressed, uri: 'file:///tmp/b-compressed.mp4'}
    const compressVideo = jest
      .fn<VideoUploadDependencies['compressVideo']>()
      .mockResolvedValueOnce(compressed)
      .mockResolvedValue(fresh)
    const uploadVideo = jest
      .fn<VideoUploadDependencies['uploadVideo']>()
      .mockRejectedValueOnce(new Error('network'))
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValue(completedJob)
    const h = makeStore({getFileSize, compressVideo, uploadVideo})
    const mediaId = h.addVideo()
    await flush()

    h.retry(mediaId)
    await flush()
    expect(compressVideo).toHaveBeenCalledTimes(2)
    expect(uploadVideo.mock.calls[1][0].video).toBe(fresh)
    expect(h.video(mediaId).upload.state).toBe('failed')

    /* The fresh result replaced the stale entry, so the next retry reuses it. */
    h.retry(mediaId)
    await flush()
    expect(compressVideo).toHaveBeenCalledTimes(2)
    expect(uploadVideo.mock.calls[2][0].video).toBe(fresh)
    expect(h.video(mediaId).upload.state).toBe('uploaded')
    h.store.destroy()
  })

  test('native output whose size changed is not reused', async () => {
    const h = makeStore({
      getFileSize: presentFile(compressed.size - 1),
      uploadVideo: failThenComplete(),
    })
    const mediaId = h.addVideo()
    await flush()
    h.retry(mediaId)
    await flush()

    expect(h.compressVideo).toHaveBeenCalledTimes(2)
    expect(h.video(mediaId).upload.state).toBe('uploaded')
    h.store.destroy()
  })

  test('a failed compression is not retained', async () => {
    const compressVideo = jest
      .fn<VideoUploadDependencies['compressVideo']>()
      .mockRejectedValueOnce(new Error('compress failed'))
      .mockResolvedValue(compressed)
    const h = makeStore({compressVideo})
    const mediaId = h.addVideo()
    await flush()
    expect(h.video(mediaId).upload.state).toBe('failed')

    h.retry(mediaId)
    await flush()

    expect(compressVideo).toHaveBeenCalledTimes(2)
    expect(h.video(mediaId).upload.state).toBe('uploaded')
    h.store.destroy()
  })

  test('an oversized output is never uploaded', async () => {
    const h = makeStore({
      compressVideo: jest.fn(() =>
        Promise.resolve({...compressed, size: Number.MAX_SAFE_INTEGER}),
      ),
    })
    const mediaId = h.addVideo()
    await flush()

    expect(h.video(mediaId).upload).toMatchObject({
      state: 'failed',
      retryable: false,
    })
    expect(h.uploadVideo).not.toHaveBeenCalled()
    h.store.destroy()
  })

  test('a reused output is validated before upload too', async () => {
    const uploadVideo = jest.fn<VideoUploadDependencies['uploadVideo']>()
    const reportFailure = jest.fn<VideoUploadAttempt['reportFailure']>()
    const release = jest.fn()
    /* Web output is in memory, so no file stat is needed to reuse it. */
    mockIsWeb = true
    startVideoUpload({
      ...testUploadRuntime,
      ...fakeVideoDependencies({createVideoTelemetry, uploadVideo}),
      metric: jest.fn(),
      media: {
        kind: 'video',
        id: 'media',
        postId: 'post',
        uri: source.uri,
        altText: '',
        captions: [],
        captionBlobs: [],
        upload: {state: 'pending'},
      },
      attempt: fakeUploadAttempt({
        reportFailure,
        acquireCompressedVideo: () => ({
          video: {...compressed, size: Number.MAX_SAFE_INTEGER},
          invalidate: jest.fn(),
          release,
        }),
      }),
    })
    await flush()

    expect(uploadVideo).not.toHaveBeenCalled()
    expect(reportFailure).toHaveBeenLastCalledWith({
      status: expect.objectContaining({state: 'failed'}),
      diagnostic: expect.objectContaining({
        cause: expect.any(VideoTooLargeError),
      }),
    })
    expect(release).toHaveBeenCalledTimes(1)
  })

  test('a caption edit mid-compression discards the late result and compresses again', async () => {
    const late = deferred<CompressedVideo>()
    const compressVideo = jest
      .fn<VideoUploadDependencies['compressVideo']>()
      .mockReturnValueOnce(late.promise)
      .mockResolvedValue({...compressed, uri: 'file:///tmp/second.mp4'})
    const h = makeStore({compressVideo})
    const mediaId = h.addVideo()
    await flush()

    h.store.actions.setVideoCaptions(h.postId, mediaId, [
      {lang: 'en', content: 'WEBVTT'},
    ])
    await flush()
    late.resolve({...compressed, uri: 'file:///tmp/late.mp4'})
    await flush()

    expect(compressVideo).toHaveBeenCalledTimes(2)
    expect(h.uploadVideo).toHaveBeenCalledTimes(1)
    expect(h.uploadVideo.mock.calls[0][0].video.uri).toBe(
      'file:///tmp/second.mp4',
    )
    h.store.destroy()
  })

  test('a caption edit mid-upload reuses the completed compression', async () => {
    const uploadVideo = pendingUntilAborted()
    const h = makeStore({uploadVideo})
    const mediaId = h.addVideo()
    await flush()

    h.store.actions.setVideoCaptions(h.postId, mediaId, [
      {lang: 'en', content: 'WEBVTT'},
    ])
    await flush()

    expect(h.compressVideo).toHaveBeenCalledTimes(1)
    expect(uploadVideo).toHaveBeenCalledTimes(2)
    expect(uploadVideo.mock.calls[1][0].video).toBe(
      uploadVideo.mock.calls[0][0].video,
    )
    expect(h.events().filter(name => name.endsWith('compressStarted'))).toEqual(
      ['video:upload:compressStarted'],
    )
    h.store.destroy()
  })

  test('alt text edits do not disturb reuse', async () => {
    const h = makeStore({uploadVideo: failThenComplete()})
    const mediaId = h.addVideo()
    await flush()
    h.store.actions.updateMediaAltText(h.postId, mediaId, 'a video')
    h.retry(mediaId)
    await flush()

    expect(h.compressVideo).toHaveBeenCalledTimes(1)
    expect(h.video(mediaId).upload.state).toBe('uploaded')
    h.store.destroy()
  })

  test('removing the video and adding it again compresses the new item', async () => {
    const h = makeStore({uploadVideo: failThenComplete()})
    const first = h.addVideo()
    await flush()
    h.store.actions.removeMedia(h.postId, first)
    const second = h.addVideo()
    await flush()

    expect(h.compressVideo).toHaveBeenCalledTimes(2)
    expect(h.video(second).upload.state).toBe('uploaded')
    h.store.destroy()
  })

  test('a completed video blob is reused ahead of any compression', async () => {
    const uploadBlob = jest
      .fn<VideoUploadDependencies['uploadBlob']>()
      .mockRejectedValueOnce(new Error('caption failed'))
      .mockResolvedValue({blob: captionBlob('en')})
    const h = makeStore({uploadBlob})
    const mediaId = h.addVideo({captions: [{lang: 'en', content: 'WEBVTT'}]})
    await flush()
    expect(h.video(mediaId).upload.state).toBe('failed')

    h.retry(mediaId)
    await flush()

    expect(h.video(mediaId).upload.state).toBe('uploaded')
    expect(h.compressVideo).toHaveBeenCalledTimes(1)
    expect(h.uploadVideo).toHaveBeenCalledTimes(1)
    h.store.destroy()
  })
})

describe('android: restored passthrough copies', () => {
  /** The compressor returns its input unchanged, so output aliases the copy. */
  const passthrough = () =>
    jest.fn<VideoUploadDependencies['compressVideo']>(asset =>
      Promise.resolve({
        uri: asset.uri,
        size: 1024,
        mimeType: 'video/mp4',
        passthroughReason: 'below-byte-threshold',
      }),
    )

  test('a retry reads the same copy and releases it once the blob supersedes it', async () => {
    mockIsAndroid = true
    const {copyVideoToCache, released} = fakeCopy()
    const compressVideo = passthrough()
    const h = makeStore({
      copyVideoToCache,
      compressVideo,
      uploadVideo: failThenComplete(),
    })
    const mediaId = h.addVideo({restored: true})
    await flush()
    expect(h.video(mediaId).upload.state).toBe('failed')
    /* The failed attempt is over, but the retained result still needs the copy. */
    expect(released).toEqual([])

    h.retry(mediaId)
    await flush()

    expect(h.video(mediaId).upload.state).toBe('uploaded')
    expect(copyVideoToCache).toHaveBeenCalledTimes(1)
    expect(compressVideo).toHaveBeenCalledTimes(1)
    expect(h.uploadVideo.mock.calls[1][0].video.uri).toBe(
      'file:///cache/copy-1.mp4',
    )
    expect(released).toEqual(['file:///cache/copy-1.mp4'])
    expect(h.video(mediaId).uri).toBe(source.uri)
    h.store.destroy()
    expect(released).toEqual(['file:///cache/copy-1.mp4'])
  })

  test('a compression failure releases its copy and a retry makes a new one', async () => {
    mockIsAndroid = true
    const {copyVideoToCache, released} = fakeCopy()
    const compressVideo = passthrough().mockRejectedValueOnce(
      new Error('compress failed'),
    )
    const h = makeStore({copyVideoToCache, compressVideo})
    const mediaId = h.addVideo({restored: true})
    await flush()
    expect(released).toEqual(['file:///cache/copy-1.mp4'])

    h.retry(mediaId)
    await flush()

    expect(copyVideoToCache).toHaveBeenCalledTimes(2)
    expect(h.video(mediaId).upload.state).toBe('uploaded')
    expect(released).toEqual([
      'file:///cache/copy-1.mp4',
      'file:///cache/copy-2.mp4',
    ])
    h.store.destroy()
  })

  test('a cached copy that went missing is released once and replaced', async () => {
    mockIsAndroid = true
    const {copyVideoToCache, released} = fakeCopy()
    const getFileSize = jest
      .fn<VideoUploadDependencies['getFileSize']>()
      .mockRejectedValueOnce(new Error('missing'))
      .mockResolvedValue(1024)
    const h = makeStore({
      copyVideoToCache,
      compressVideo: passthrough(),
      getFileSize,
      uploadVideo: failThenComplete(),
    })
    const mediaId = h.addVideo({restored: true})
    await flush()
    h.retry(mediaId)
    await flush()

    expect(copyVideoToCache).toHaveBeenCalledTimes(2)
    expect(h.compressVideo).toHaveBeenCalledTimes(2)
    expect(h.uploadVideo.mock.calls[1][0].video.uri).toBe(
      'file:///cache/copy-2.mp4',
    )
    expect(h.video(mediaId).upload.state).toBe('uploaded')
    expect(released).toEqual([
      'file:///cache/copy-1.mp4',
      'file:///cache/copy-2.mp4',
    ])
    h.store.destroy()
  })

  test('an encoded output is retained without keeping the source copy', async () => {
    mockIsAndroid = true
    const {copyVideoToCache, released} = fakeCopy()
    const h = makeStore({copyVideoToCache, uploadVideo: failThenComplete()})
    const mediaId = h.addVideo({restored: true})
    await flush()
    expect(released).toEqual(['file:///cache/copy-1.mp4'])

    h.retry(mediaId)
    await flush()

    expect(copyVideoToCache).toHaveBeenCalledTimes(1)
    expect(h.compressVideo).toHaveBeenCalledTimes(1)
    expect(h.video(mediaId).upload.state).toBe('uploaded')
    h.store.destroy()
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
    {
      action: 'destroying the store',
      remove: (h: ReturnType<typeof makeStore>) => h.store.destroy(),
    },
  ])('$action releases a retained copy', async ({remove}) => {
    mockIsAndroid = true
    const {copyVideoToCache, released} = fakeCopy()
    const h = makeStore({
      copyVideoToCache,
      compressVideo: passthrough(),
      uploadVideo: pendingUntilAborted(),
    })
    const mediaId = h.addVideo({restored: true})
    await flush()
    expect(released).toEqual([])

    remove(h, mediaId)
    await flush()

    expect(released).toEqual(['file:///cache/copy-1.mp4'])
    h.store.destroy()
  })
})

describe('captions after the video is processed', () => {
  /* Fresh mocks per test, so call counts do not leak between cases. */
  const polled = () => ({
    uploadVideo: jest.fn<VideoUploadDependencies['uploadVideo']>(() =>
      Promise.resolve({state: 'JOB_STATE_ENCODING', jobId: 'job-1'} as never),
    ),
    createVideoServiceClient: completedJobClient({blob: videoBlob}),
    sleep: () => Promise.resolve(),
  })

  const handoffs = [
    {handoff: 'an immediately completed job', video: () => ({})},
    {handoff: 'a polled job', video: polled},
  ]

  test.each(handoffs)(
    'editing captions during a pending caption upload reuses the video ($handoff)',
    async ({video}) => {
      const first = deferred<{blob: BlobRef}>()
      const uploadBlob = jest
        .fn<VideoUploadDependencies['uploadBlob']>()
        .mockReturnValueOnce(first.promise)
        .mockResolvedValue({blob: captionBlob('edited')})
      const h = makeStore({...video(), uploadBlob})
      const mediaId = h.addVideo({captions: [{lang: 'en', content: 'old'}]})
      await flush()
      expect(uploadBlob).toHaveBeenCalledTimes(1)
      expect(h.video(mediaId).videoBlob).toBe(videoBlob)
      expect(h.video(mediaId).upload).toMatchObject({
        state: 'uploading',
        phase: 'captions',
      })

      h.store.actions.setVideoCaptions(h.postId, mediaId, [
        {lang: 'en', content: 'new'},
      ])
      await flush()
      expect(h.video(mediaId).upload.state).toBe('uploaded')
      const edited = h.video(mediaId).captionBlobs

      /* The old caption request finishes late and must not replace the edit. */
      first.resolve({blob: captionBlob('stale')})
      await flush()

      expect(h.compressVideo).toHaveBeenCalledTimes(1)
      expect(h.uploadVideo).toHaveBeenCalledTimes(1)
      expect(uploadBlob).toHaveBeenCalledTimes(2)
      const item = h.video(mediaId)
      expect(item.captionBlobs).toBe(edited)
      expect(item.captionBlobs).toEqual([
        {lang: 'en', blob: captionBlob('edited')},
      ])
      expect(item.upload).toMatchObject({state: 'uploaded', blob: videoBlob})
      expect(item.captions).toEqual([{lang: 'en', content: 'new'}])

      /* One video funnel; the caption restart reuses its telemetry. */
      expect(h.payloads('video:upload:picked')).toHaveLength(1)
      expect(h.payloads('video:upload:uploadStarted')).toHaveLength(1)
      const [picked] = h.payloads('video:upload:picked') as Array<{
        uploadId: string
      }>
      h.store.reportPublished({plan: planEmbedding({postId: h.postId})})
      expect(h.payloads('video:upload:published')).toEqual([
        expect.objectContaining({uploadId: picked.uploadId}),
      ])
      h.store.destroy()
    },
  )

  test.each(handoffs)(
    'a subscriber that restarts the item as the blob is adopted starts no stale caption work ($handoff)',
    async ({video}) => {
      const uploadBlob = jest
        .fn<VideoUploadDependencies['uploadBlob']>()
        .mockResolvedValue({blob: captionBlob('edited')})
      const h = makeStore({...video(), uploadBlob})
      let edited = false
      h.store.subscribe(() => {
        const item = getMediaItems({
          media: h.store.getState().posts[h.postId].attachments.media,
        })[0] as PostMediaVideo | undefined
        if (edited || !item?.videoBlob) return
        edited = true
        h.store.actions.setVideoCaptions(h.postId, item.id, [
          {lang: 'en', content: 'new'},
        ])
      })
      const mediaId = h.addVideo({captions: [{lang: 'en', content: 'old'}]})
      await flush()

      expect(edited).toBe(true)
      expect(h.compressVideo).toHaveBeenCalledTimes(1)
      expect(h.uploadVideo).toHaveBeenCalledTimes(1)
      /* Only the restarted attempt uploads captions, and only the edited one. */
      expect(uploadBlob).toHaveBeenCalledTimes(1)
      expect(await (uploadBlob.mock.calls[0][1] as Blob).text()).toBe('new')
      expect(h.video(mediaId).upload).toMatchObject({
        state: 'uploaded',
        blob: videoBlob,
      })
      h.store.destroy()
    },
  )

  test('a subscriber that removes the item as the blob is adopted stops the worker', async () => {
    const {copyVideoToCache, released} = fakeCopy()
    mockIsAndroid = true
    const uploadBlob = jest.fn<VideoUploadDependencies['uploadBlob']>()
    const h = makeStore({
      copyVideoToCache,
      uploadBlob,
      compressVideo: asset =>
        Promise.resolve({uri: asset.uri, size: 1024, mimeType: 'video/mp4'}),
    })
    let removed = false
    h.store.subscribe(() => {
      const item = getMediaItems({
        media: h.store.getState().posts[h.postId].attachments.media,
      })[0] as PostMediaVideo | undefined
      if (removed || !item?.videoBlob) return
      removed = true
      h.store.actions.removeMedia(h.postId, item.id)
    })
    h.addVideo({captions: [{lang: 'en', content: 'old'}], restored: true})
    await flush()

    expect(removed).toBe(true)
    expect(uploadBlob).not.toHaveBeenCalled()
    expect(released).toEqual(['file:///cache/copy-1.mp4'])
    h.store.destroy()
  })
})
