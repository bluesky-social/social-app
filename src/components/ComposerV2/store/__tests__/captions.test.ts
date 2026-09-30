import {type BlobRef} from '@atproto/lex'
import {describe, expect, jest, test} from '@jest/globals'

/* Avoid loading the UI module chain through the real link resolver. */
jest.mock('#/lib/api/resolve', () => {
  class EmbeddingDisabledError extends Error {}
  return {resolveLink: jest.fn(), EmbeddingDisabledError}
})

import {type LinkResolvers} from '#/lib/api/resolve'
import {createThreadStore} from '#/components/ComposerV2/store'
import {
  realUploadWorkers,
  testUploadRuntime,
} from '#/components/ComposerV2/store/__tests__/uploadTestUtils'
import {
  type PostMediaVideo,
  type UploadStatus,
} from '#/components/ComposerV2/store/types'
import {
  type UploadTask,
  type UploadWorkerOverrides,
  type VideoUploadDependencies,
} from '#/components/ComposerV2/store/uploads'

const resolvers = {} as LinkResolvers

const blob = (name: string) =>
  ({
    $type: 'blob',
    ref: {$link: name},
    mimeType: 'video/mp4',
    size: 1,
  }) as unknown as BlobRef

function makeIdGenerator() {
  let i = 0
  return () => `id-${++i}`
}

const videoInput = {
  kind: 'video' as const,
  item: {
    uri: 'file:///tmp/a.mp4',
    width: 1920,
    height: 1080,
    mimeType: 'video/mp4',
    captions: [{lang: 'en', content: 'original english'}],
  },
}

/**
 * Controllable worker: records started uploads and lets tests drive status
 * transitions through the store's guarded callbacks.
 */
function makeManualWorkers() {
  const started: Array<{
    mediaId: string
    media: PostMediaVideo
    report: (status: UploadStatus) => void
    cancelled: boolean
  }> = []
  const workers: UploadWorkerOverrides = {
    startVideoUpload: opts => {
      const entry = {
        mediaId: opts.mediaId,
        media: opts.media,
        report: (status: UploadStatus) =>
          opts.setUploadStatus(opts.postId, opts.mediaId, status),
        cancelled: false,
      }
      started.push(entry)
      const task: UploadTask = {
        cancel() {
          entry.cancelled = true
        },
      }
      return task
    },
    startImageUpload: () => ({cancel() {}}),
  }
  return {started, workers}
}

function getVideo(store: ReturnType<typeof createThreadStore>) {
  const postId = Object.keys(store.getState().posts)[0]
  const media = store.getState().posts[postId].attachments.media
  if (media?.state !== 'resolved' || media.kind !== 'video') {
    throw new Error('expected a video attachment')
  }
  return {postId, item: media.item}
}

describe('failed video upload normalization', () => {
  test('retains partial video and caption blobs for an explicit retry', () => {
    const {started, workers} = makeManualWorkers()
    const store = createThreadStore({
      ...testUploadRuntime,
      resolvers,
      __createId: makeIdGenerator(),
      __uploadWorkers: workers,
      initialState: {posts: [{attachments: {media: {...videoInput}}}]},
    })
    const videoBlob = blob('video')
    const captionBlobs = [{lang: 'en', blob: blob('caption-en')}]

    started[0].report({
      state: 'failed',
      error: 'caption upload failed',
      code: 'caption-upload-failed',
      blob: videoBlob,
      captionBlobs,
    })

    const failed = getVideo(store).item
    if (failed.upload.state !== 'failed' || failed.upload.retryable !== true) {
      throw new Error('expected retryable failed upload')
    }
    expect(failed.upload).toMatchObject({
      error: 'caption upload failed',
      code: 'caption-upload-failed',
      retryable: true,
    })
    expect(failed.videoBlob).toBe(videoBlob)
    expect(failed.captionBlobs).toEqual(captionBlobs)
    expect(store.getState().isDirty).toBe(false)

    failed.upload.retry()
    expect(started).toHaveLength(2)
    expect(started[1].media.videoBlob).toBe(videoBlob)
    expect(started[1].media.captionBlobs).toEqual(captionBlobs)
    expect(store.getState().isDirty).toBe(false)
    store.destroy()
  })
})

test('a real caption retry reuses video and unchanged captions after a partial failure and edit', async () => {
  const videoBlob = blob('video')
  const english = blob('english')
  const french = blob('french')
  const editedEnglish = blob('edited-english')
  const editedGerman = blob('edited-german')
  const getVideoMetadata = jest
    .fn<VideoUploadDependencies['getVideoMetadata']>()
    .mockResolvedValue({
      uri: videoInput.item.uri,
      width: 1920,
      height: 1080,
      mimeType: 'video/mp4',
      duration: 1000,
    })
  const compressVideo = jest
    .fn<VideoUploadDependencies['compressVideo']>()
    .mockResolvedValue({
      uri: 'file:///compressed.mp4',
      size: 100,
      mimeType: 'video/mp4',
    })
  const uploadVideo = jest
    .fn<VideoUploadDependencies['uploadVideo']>()
    .mockResolvedValue({
      state: 'JOB_STATE_COMPLETED',
      jobId: 'job-1',
      did: 'did:plc:example',
      blob: videoBlob,
    })
  const uploadBlob = jest
    .fn<VideoUploadDependencies['uploadBlob']>()
    .mockResolvedValueOnce({blob: english})
    .mockResolvedValueOnce({blob: french})
    .mockRejectedValueOnce(new Error('caption upload failed'))
    .mockResolvedValueOnce({blob: editedEnglish})
    .mockResolvedValueOnce({blob: editedGerman})
  const store = createThreadStore({
    ...testUploadRuntime,
    resolvers,
    __createId: makeIdGenerator(),
    initialState: {
      posts: [
        {
          attachments: {
            media: {
              kind: 'video',
              item: {
                ...videoInput.item,
                captions: [
                  {lang: 'en', content: 'original english'},
                  {lang: 'fr', content: 'original french'},
                  {lang: 'de', content: 'original german'},
                ],
              },
            },
          },
        },
      ],
    },
    i18n: {_: () => 'Upload failed'} as never,
    /* Polling is not faked; reaching it fails the upload. */
    __uploadWorkers: realUploadWorkers({
      video: {getVideoMetadata, compressVideo, uploadVideo, uploadBlob},
    }),
  })
  const waitForUpload = async (state: 'failed' | 'uploaded') => {
    if (getVideo(store).item.upload.state === state) return
    await new Promise<void>(resolve => {
      const unsubscribe = store.subscribe(() => {
        if (getVideo(store).item.upload.state === state) {
          unsubscribe()
          resolve()
        }
      })
    })
  }
  try {
    await waitForUpload('failed')
    const {postId, item: failed} = getVideo(store)
    expect(store.getState().isDirty).toBe(false)
    expect(failed.videoBlob).toBe(videoBlob)
    expect(failed.captionBlobs).toEqual([
      {lang: 'en', blob: english},
      {lang: 'fr', blob: french},
    ])
    const editedCaptions = [
      {lang: 'en', content: 'new english caption'},
      {lang: 'fr', content: 'original french'},
      {lang: 'de', content: 'new and longer german caption'},
    ]
    store.actions.setVideoCaptions(postId, failed.id, editedCaptions)
    expect(getVideo(store).item.captionBlobs).toEqual([
      {lang: 'fr', blob: french},
    ])
    expect(uploadBlob).toHaveBeenCalledTimes(3)
    if (failed.upload.state !== 'failed' || !failed.upload.retryable)
      throw new Error('expected retryable failure')
    failed.upload.retry()
    await waitForUpload('uploaded')

    const completed = getVideo(store).item
    expect(completed.videoBlob).toBe(videoBlob)
    expect(completed.captionBlobs).toEqual([
      {lang: 'fr', blob: french},
      {lang: 'en', blob: editedEnglish},
      {lang: 'de', blob: editedGerman},
    ])
    expect(completed.captions).toEqual(editedCaptions)
    expect(store.getState().isDirty).toBe(true)
    expect(getVideoMetadata).toHaveBeenCalledTimes(1)
    expect(compressVideo).toHaveBeenCalledTimes(1)
    expect(uploadVideo).toHaveBeenCalledTimes(1)
    expect(uploadBlob).toHaveBeenCalledTimes(5)
    expect(
      uploadBlob.mock.calls.slice(3).map(([, input]) => (input as Blob).size),
    ).toEqual([
      editedCaptions[0].content.length,
      editedCaptions[2].content.length,
    ])
    expect(failed.captions[0].content).toBe('original english')
    expect(failed.captionBlobs).toEqual([
      {lang: 'en', blob: english},
      {lang: 'fr', blob: french},
    ])
    expect(failed.upload.state).toBe('failed')
  } finally {
    store.destroy()
  }
})

describe('setVideoCaptions', () => {
  test('updates captions, marks dirty, and prunes stale caption blobs', () => {
    const {started, workers} = makeManualWorkers()
    const store = createThreadStore({
      ...testUploadRuntime,
      resolvers,
      __createId: makeIdGenerator(),
      __uploadWorkers: workers,
      initialState: {posts: [{attachments: {media: {...videoInput}}}]},
    })
    const {postId, item} = getVideo(store)

    /* Complete the initial upload with caption blobs for both languages. */
    store.actions.setVideoCaptions(postId, item.id, [
      {lang: 'en', content: 'original english'},
      {lang: 'de', content: 'original german'},
    ])
    started[started.length - 1].report({
      state: 'uploaded',
      blob: blob('video'),
      captionBlobs: [
        {lang: 'en', blob: blob('caption-en')},
        {lang: 'de', blob: blob('caption-de')},
      ],
    })
    expect(getVideo(store).item.captionBlobs).toHaveLength(2)

    /* Change one caption's content: only the unchanged blob survives. */
    store.actions.setVideoCaptions(postId, item.id, [
      {lang: 'en', content: 'edited english'},
      {lang: 'de', content: 'original german'},
    ])
    const after = getVideo(store).item
    expect(after.captions).toEqual([
      {lang: 'en', content: 'edited english'},
      {lang: 'de', content: 'original german'},
    ])
    expect(after.captionBlobs.map(c => c.lang)).toEqual(['de'])
    expect(store.getState().isDirty).toBe(true)
    store.destroy()
  })

  test('restarts a completed upload and reuses the completed video blob', () => {
    const {started, workers} = makeManualWorkers()
    const store = createThreadStore({
      ...testUploadRuntime,
      resolvers,
      __createId: makeIdGenerator(),
      __uploadWorkers: workers,
      initialState: {posts: [{attachments: {media: {...videoInput}}}]},
    })
    const {postId, item} = getVideo(store)
    expect(started).toHaveLength(1)
    started[0].report({
      state: 'uploaded',
      blob: blob('video'),
      captionBlobs: [{lang: 'en', blob: blob('caption-en')}],
    })
    expect(getVideo(store).item.upload.state).toBe('uploaded')

    store.actions.setVideoCaptions(postId, item.id, [
      {lang: 'en', content: 'original english'},
      {lang: 'de', content: 'new german'},
    ])

    /* A new worker starts with the retained video blob and kept blobs. */
    expect(started).toHaveLength(2)
    const restarted = started[1]
    expect(restarted.media.videoBlob).toBeDefined()
    expect(restarted.media.captionBlobs.map(c => c.lang)).toEqual(['en'])
    expect(restarted.media.captions.map(c => c.lang)).toEqual(['en', 'de'])
    expect(getVideo(store).item.upload.state).toBe('pending')
    store.destroy()
  })

  test('does not restart a completed upload for separately allocated identical captions', () => {
    const {started, workers} = makeManualWorkers()
    const store = createThreadStore({
      ...testUploadRuntime,
      resolvers,
      __createId: makeIdGenerator(),
      __uploadWorkers: workers,
      initialState: {posts: [{attachments: {media: {...videoInput}}}]},
    })
    const {postId, item} = getVideo(store)
    started[0].report({
      state: 'uploaded',
      blob: blob('video'),
      captionBlobs: [{lang: 'en', blob: blob('caption-en')}],
    })
    const before = store.getState()
    const notified = jest.fn()
    store.subscribe(notified)

    store.actions.setVideoCaptions(postId, item.id, [
      {lang: 'en', content: 'original english'},
    ])

    expect(started).toHaveLength(1)
    expect(started[0].cancelled).toBe(false)
    expect(store.getState()).toBe(before)
    expect(notified).not.toHaveBeenCalled()
    expect(getVideo(store).item.upload.state).toBe('uploaded')
    store.destroy()
  })

  test('cancels in-flight work before restarting with edited captions', () => {
    const {started, workers} = makeManualWorkers()
    const store = createThreadStore({
      ...testUploadRuntime,
      resolvers,
      __createId: makeIdGenerator(),
      __uploadWorkers: workers,
      initialState: {posts: [{attachments: {media: {...videoInput}}}]},
    })
    const {postId, item} = getVideo(store)
    started[0].report({state: 'uploading', phase: 'uploading', progress: 0.5})

    store.actions.setVideoCaptions(postId, item.id, [
      {lang: 'en', content: 'edited while uploading'},
    ])

    expect(started[0].cancelled).toBe(true)
    expect(started).toHaveLength(2)
    /* The cancelled worker's callbacks are stale and must be ignored. */
    started[0].report({state: 'uploaded', blob: blob('stale')})
    expect(getVideo(store).item.upload.state).not.toBe('uploaded')
    store.destroy()
  })

  test('leaves failed uploads alone for an explicit retry', () => {
    const {started, workers} = makeManualWorkers()
    const store = createThreadStore({
      ...testUploadRuntime,
      resolvers,
      __createId: makeIdGenerator(),
      __uploadWorkers: workers,
      initialState: {posts: [{attachments: {media: {...videoInput}}}]},
    })
    const {postId, item} = getVideo(store)
    started[0].report({state: 'failed', error: 'network', retryable: true})

    store.actions.setVideoCaptions(postId, item.id, [
      {lang: 'en', content: 'edited after failure'},
    ])

    expect(started).toHaveLength(1)
    const after = getVideo(store).item
    expect(after.upload.state).toBe('failed')
    expect(after.captions[0].content).toBe('edited after failure')
    store.destroy()
  })

  test('ignores identical captions, non-videos, and destroyed stores', () => {
    const {started, workers} = makeManualWorkers()
    const store = createThreadStore({
      ...testUploadRuntime,
      resolvers,
      __createId: makeIdGenerator(),
      __uploadWorkers: workers,
      initialState: {posts: [{attachments: {media: {...videoInput}}}]},
    })
    const {postId, item} = getVideo(store)
    const notified = jest.fn()
    store.subscribe(notified)

    store.actions.setVideoCaptions(postId, item.id, [
      {lang: 'en', content: 'original english'},
    ])
    expect(notified).not.toHaveBeenCalled()
    store.actions.setVideoCaptions(postId, 'missing-media', [
      {lang: 'en', content: 'other'},
    ])
    expect(notified).not.toHaveBeenCalled()

    store.destroy()
    store.actions.setVideoCaptions(postId, item.id, [
      {lang: 'en', content: 'after destroy'},
    ])
    expect(started).toHaveLength(1)
  })
})
