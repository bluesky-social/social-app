import {type BlobRef} from '@atproto/lex'
import {describe, expect, jest, test} from '@jest/globals'

import {type VideoTelemetry} from '#/lib/media/video/telemetry'
import {type CompressedVideo} from '#/lib/media/video/types'
import {type ThreadPlan} from '#/components/ComposerV2/planner'
import {
  createMediaUploads,
  type MediaUploadUpdate,
} from '#/components/ComposerV2/store/mediaUploads'
import {
  type PostMediaImage,
  type PostMediaVideo,
} from '#/components/ComposerV2/store/types'
import {
  type ImageUploadAttempt,
  type UploadTask,
  type VideoUploadAttempt,
} from '#/components/ComposerV2/store/uploads'
import {
  fakeAnalytics,
  noopVideoTelemetry,
  testUploadRuntime,
} from './uploadTestUtils'

type Started = {
  media: PostMediaImage | PostMediaVideo
  attempt: ImageUploadAttempt & VideoUploadAttempt
  restart?: {reason: string; previousUploadId?: string}
  uploadedVideoTelemetry?: VideoTelemetry
  cancel: jest.Mock<UploadTask['cancel']>
}

const blob = {$type: 'blob'} as unknown as BlobRef
const video = {
  uri: 'file:///c.mp4',
  mimeType: 'video/mp4',
  size: 1,
} as CompressedVideo

function image({id = 'img'}: {id?: string} = {}) {
  return {
    kind: 'image',
    id,
    postId: 'post',
    uri: 'file:///a.jpg',
    altText: '',
    upload: {state: 'pending'},
  } as unknown as PostMediaImage
}

function videoItem({
  id = 'vid',
  videoBlob,
}: {id?: string; videoBlob?: BlobRef} = {}) {
  return {
    kind: 'video',
    id,
    postId: 'post',
    uri: 'file:///a.mp4',
    altText: '',
    captions: [],
    captionBlobs: [],
    videoBlob,
    upload: {state: 'pending'},
  } as unknown as PostMediaVideo
}

function telemetry(uploadId: string) {
  return {
    ...noopVideoTelemetry(),
    uploadId,
    published: jest.fn(),
  } as VideoTelemetry & {published: jest.Mock}
}

function planEmbedding(): ThreadPlan {
  return {
    posts: [
      {
        postId: 'post',
        record: {embed: {$type: 'app.bsky.embed.video', video: blob}},
      },
    ],
  } as unknown as ThreadPlan
}

/** Fake workers that record every start and let a test drive the attempt. */
function makeUploads({
  onStart,
  onUpdate,
}: {
  onStart?: (started: Started) => void
  onUpdate?: (update: MediaUploadUpdate) => void
} = {}) {
  const started: Started[] = []
  const updates: MediaUploadUpdate[] = []
  const {metric} = fakeAnalytics()
  const start = (options: Omit<Started, 'cancel'>) => {
    const entry = {...options, cancel: jest.fn<UploadTask['cancel']>()}
    started.push(entry)
    onStart?.(entry)
    return {cancel: entry.cancel}
  }
  const uploads = createMediaUploads({
    ...testUploadRuntime,
    metric,
    onUpdate: update => {
      updates.push(update)
      onUpdate?.(update)
    },
    __uploadWorkers: {
      startImageUpload: start as never,
      startVideoUpload: start,
    },
  })
  return {uploads, started, updates, metric}
}

const uploading = {state: 'uploading', progress: 0.5} as const
const retryableFailure = {
  status: {state: 'failed', code: 'network', retryable: true},
  diagnostic: {kind: 'operational', cause: undefined},
} as const
const finalFailure = {
  status: {state: 'failed', code: 'video-rejected', retryable: false},
  diagnostic: {kind: 'validation', cause: undefined},
} as const

describe('start', () => {
  test('is idempotent while an attempt for the id is running', () => {
    const {uploads, started} = makeUploads()
    uploads.start({postId: 'post', item: image()})
    uploads.start({postId: 'post', item: image()})
    expect(started).toHaveLength(1)
  })

  test('forwards a status from the current attempt', () => {
    const {uploads, started, updates} = makeUploads()
    uploads.start({postId: 'post', item: image()})
    started[0].attempt.reportStatus({status: uploading})
    expect(updates).toEqual([
      {type: 'status', postId: 'post', mediaId: 'img', status: uploading},
    ])
  })

  test('a reentrant cancel during a synchronous first report reaches the handle', () => {
    const {uploads, started} = makeUploads({
      onStart: ({attempt}) => attempt.reportStatus({status: uploading}),
      onUpdate: () => uploads.cancel({mediaId: 'img', abandoned: 'removed'}),
    })
    uploads.start({postId: 'post', item: image()})
    expect(started[0].cancel).toHaveBeenCalledTimes(1)
    expect(started[0].cancel).toHaveBeenCalledWith({abandoned: 'removed'})
  })

  test('emits start-failed and rethrows when the worker throws', () => {
    const cause = new Error('boom')
    const {uploads, updates} = makeUploads({
      onStart: () => {
        throw cause
      },
    })
    expect(() => uploads.start({postId: 'post', item: image()})).toThrow(cause)
    expect(updates).toEqual([
      {type: 'start-failed', postId: 'post', mediaId: 'img', cause},
    ])
  })

  test('a failed start frees the id', () => {
    let fail = true
    const {uploads, started} = makeUploads({
      onStart: () => {
        if (fail) throw new Error('boom')
      },
    })
    expect(() => uploads.start({postId: 'post', item: image()})).toThrow()
    fail = false
    uploads.start({postId: 'post', item: image()})
    expect(started).toHaveLength(2)
  })

  test('skips start-failed, but still rethrows, when the attempt is no longer current', () => {
    const cause = new Error('boom')
    const {uploads, updates} = makeUploads({
      onStart: () => {
        uploads.cancel({mediaId: 'img'})
        throw cause
      },
    })
    expect(() => uploads.start({postId: 'post', item: image()})).toThrow(cause)
    expect(updates).toEqual([])
  })
})

describe('dropped updates', () => {
  const calls: Array<[string, (attempt: Started['attempt']) => void]> = [
    ['status', a => a.reportStatus({status: uploading})],
    ['failure', a => a.reportFailure(retryableFailure)],
    ['source metadata', a => a.setSourceMetadata({metadata: {}})],
    [
      'compression result',
      a => a.setCompressionResult({prepared: {} as never}),
    ],
    ['caption blobs', a => a.setCaptionBlobs({captions: []})],
    [
      'video telemetry',
      a => a.setVideoTelemetry({telemetry: telemetry('t'), blob}),
    ],
  ]

  const retires: Array<
    [string, (uploads: ReturnType<typeof makeUploads>['uploads']) => void]
  > = [
    ['cancel', u => u.cancel({mediaId: 'vid'})],
    ['forget', u => u.forget({mediaId: 'vid'})],
    ['destroy', u => u.destroy()],
  ]

  describe.each(retires)('after %s', (_name, retire) => {
    test.each(calls)('drops %s', (_call, call) => {
      const {uploads, started, updates} = makeUploads()
      uploads.start({postId: 'post', item: videoItem()})
      retire(uploads)
      call(started[0].attempt)
      expect(updates).toEqual([])
    })
  })

  test.each(calls)('drops %s from a replaced attempt', (_call, call) => {
    const {uploads, started, updates} = makeUploads()
    uploads.start({postId: 'post', item: videoItem()})
    uploads.cancel({mediaId: 'vid'})
    uploads.start({postId: 'post', item: videoItem()})
    call(started[0].attempt)
    expect(updates).toEqual([])
    started[1].attempt.reportStatus({status: uploading})
    expect(updates).toHaveLength(1)
  })
})

describe('terminal outcomes', () => {
  test.each([
    [
      'uploaded',
      (a: Started['attempt']) =>
        a.reportStatus({status: {state: 'uploaded', blob}}),
    ],
    [
      'a retryable failure',
      (a: Started['attempt']) => a.reportFailure(retryableFailure),
    ],
    [
      'a final failure',
      (a: Started['attempt']) => a.reportFailure(finalFailure),
    ],
  ])('%s frees the id so a later start runs', (_name, finish) => {
    const {uploads, started, updates} = makeUploads()
    uploads.start({postId: 'post', item: image()})
    finish(started[0].attempt)
    expect(updates).toHaveLength(1)
    uploads.start({postId: 'post', item: image()})
    expect(started).toHaveLength(2)
  })

  test('a failure cancels the failed worker', () => {
    const {uploads, started} = makeUploads()
    uploads.start({postId: 'post', item: image()})
    started[0].attempt.reportFailure(retryableFailure)
    expect(started[0].cancel).toHaveBeenCalledTimes(1)
  })

  test('has already freed the id when the update is delivered', () => {
    let startedDuringUpdate = 0
    const {uploads, started} = makeUploads({
      onUpdate: () => {
        uploads.start({postId: 'post', item: image()})
        startedDuringUpdate = started.length
      },
    })
    uploads.start({postId: 'post', item: image()})
    started[0].attempt.reportStatus({status: {state: 'uploaded', blob}})
    expect(startedDuringUpdate).toBe(2)
  })
})

describe('retained compression', () => {
  function retain({release}: {release: () => void}) {
    const h = makeUploads()
    h.uploads.start({postId: 'post', item: videoItem()})
    const lease = h.started[0].attempt.retainCompressedVideo({video, release})!
    return {...h, lease}
  }

  test('survives cancel so a later attempt can lease it', () => {
    const release = jest.fn()
    const {uploads, started, lease} = retain({release})
    lease.release()
    uploads.cancel({mediaId: 'vid'})
    uploads.start({postId: 'post', item: videoItem()})
    const second = started[1].attempt.acquireCompressedVideo()
    expect(second?.video).toBe(video)
    expect(release).not.toHaveBeenCalled()
  })

  test('uploaded retires it, and cleanup waits for the last lease', () => {
    const release = jest.fn()
    const {started, lease} = retain({release})
    started[0].attempt.reportStatus({status: {state: 'uploaded', blob}})
    expect(release).not.toHaveBeenCalled()
    lease.release()
    expect(release).toHaveBeenCalledTimes(1)
  })

  test('a processed blob retires it, and cleanup waits for the last lease', () => {
    const release = jest.fn()
    const {started, lease} = retain({release})
    started[0].attempt.setVideoTelemetry({telemetry: telemetry('u1'), blob})
    expect(started[0].attempt.acquireCompressedVideo()).toBeUndefined()
    expect(release).not.toHaveBeenCalled()
    lease.release()
    expect(release).toHaveBeenCalledTimes(1)
  })

  test('a retryable failure keeps it and a final failure retires it', () => {
    const kept = jest.fn()
    const a = retain({release: kept})
    a.lease.release()
    a.started[0].attempt.reportFailure(retryableFailure)
    expect(kept).not.toHaveBeenCalled()

    const dropped = jest.fn()
    const b = retain({release: dropped})
    b.lease.release()
    b.started[0].attempt.reportFailure(finalFailure)
    expect(dropped).toHaveBeenCalledTimes(1)
  })

  test('forget and destroy release it', () => {
    const forgotten = jest.fn()
    const a = retain({release: forgotten})
    a.lease.release()
    a.uploads.forget({mediaId: 'vid'})
    expect(forgotten).toHaveBeenCalledTimes(1)

    const destroyed = jest.fn()
    const b = retain({release: destroyed})
    b.lease.release()
    b.uploads.destroy()
    expect(destroyed).toHaveBeenCalledTimes(1)
  })

  test('a stale attempt cannot retain or lease', () => {
    const release = jest.fn()
    const {uploads, started} = makeUploads()
    uploads.start({postId: 'post', item: videoItem()})
    uploads.cancel({mediaId: 'vid'})
    expect(
      started[0].attempt.retainCompressedVideo({video, release}),
    ).toBeUndefined()
    expect(started[0].attempt.acquireCompressedVideo()).toBeUndefined()
  })
})

describe('video telemetry identity', () => {
  test('registers the blob telemetry before emitting video-blob', () => {
    const t = telemetry('u1')
    const {uploads, started} = makeUploads({
      onUpdate: update => {
        if (update.type !== 'video-blob') return
        uploads.cancel({mediaId: 'vid'})
        uploads.start({postId: 'post', item: videoItem({videoBlob: blob})})
      },
    })
    uploads.start({postId: 'post', item: videoItem()})
    started[0].attempt.setVideoTelemetry({telemetry: t, blob})
    expect(started[1].uploadedVideoTelemetry).toBe(t)
  })

  test('links a restart to the previous attempt until forgotten', () => {
    const {uploads, started} = makeUploads()
    uploads.start({postId: 'post', item: videoItem()})
    started[0].attempt.setVideoTelemetry({telemetry: telemetry('u1')})
    uploads.cancel({mediaId: 'vid'})
    uploads.start({postId: 'post', item: videoItem(), restartReason: 'retry'})
    expect(started[1].restart).toEqual({
      reason: 'retry',
      previousUploadId: 'u1',
    })

    uploads.forget({mediaId: 'vid'})
    uploads.start({postId: 'post', item: videoItem(), restartReason: 'retry'})
    expect(started[2].restart).toEqual({
      reason: 'retry',
      previousUploadId: undefined,
    })
  })
})

describe('destroy', () => {
  test('cancels running attempts once with the reason, and is idempotent', () => {
    const {uploads, started} = makeUploads()
    uploads.start({postId: 'post', item: image({id: 'a'})})
    uploads.start({postId: 'post', item: videoItem({id: 'b'})})
    uploads.destroy({abandoned: 'closed'})
    uploads.destroy({abandoned: 'closed'})
    for (const entry of started) {
      expect(entry.cancel).toHaveBeenCalledTimes(1)
      expect(entry.cancel).toHaveBeenCalledWith({abandoned: 'closed'})
    }
  })

  test('start does nothing afterwards', () => {
    const {uploads, started} = makeUploads()
    uploads.destroy()
    uploads.start({postId: 'post', item: image()})
    expect(started).toHaveLength(0)
  })
})

describe('publication', () => {
  test('reportPublished works after destroy and reports once', () => {
    const t = telemetry('u1')
    const {uploads, started} = makeUploads()
    uploads.start({postId: 'post', item: videoItem()})
    started[0].attempt.setVideoTelemetry({telemetry: t, blob})
    uploads.destroy({abandoned: 'closed'})

    uploads.reportPublished({plan: planEmbedding()})
    uploads.reportPublished({plan: planEmbedding()})
    expect(t.published).toHaveBeenCalledTimes(1)
  })

  test('reportPublishUncertain names the videos and leaves them publishable', () => {
    const t = telemetry('u1')
    const {uploads, started, metric} = makeUploads()
    uploads.start({postId: 'post', item: videoItem()})
    started[0].attempt.setVideoTelemetry({telemetry: t, blob})

    uploads.reportPublishUncertain({
      plan: planEmbedding(),
      cause: new Error('x'),
    })
    expect(metric).toHaveBeenCalledWith(
      'composer:publish:uncertain',
      expect.objectContaining({postCount: 1, videoUploadIds: ['u1']}),
    )
    uploads.reportPublished({plan: planEmbedding()})
    expect(t.published).toHaveBeenCalledTimes(1)
  })
})
