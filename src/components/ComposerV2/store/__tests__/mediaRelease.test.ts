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
import {VIDEO_MAX_SIZE} from '#/lib/constants'
import {type PickerImage} from '#/lib/media/picker.shared'
import {createVideoTelemetry} from '#/lib/media/video/telemetry'
import {type CompressedVideo} from '#/lib/media/video/types'
import {type ComposerV2Plan} from '#/components/ComposerV2/planner'
import {createThreadStore} from '#/components/ComposerV2/store'
import {
  fakeAnalytics,
  fakeImageDependencies,
  fakeUploadAttempt,
  realUploadWorkers,
  testUploadRuntime,
} from '#/components/ComposerV2/store/__tests__/uploadTestUtils'
import {
  type PostMediaImage,
  type PostMediaVideo,
} from '#/components/ComposerV2/store/types'
import {
  type ImageUploadDependencies,
  startImageUpload,
  type VideoUploadDependencies,
} from '#/components/ComposerV2/store/uploads'
import {getMediaItems} from '#/components/ComposerV2/store/utils/getMediaItems'

/*
 * Release of resources V2 owns: compressed image outputs and native encoded
 * video outputs. Real workers run with fake platform dependencies; every
 * release is recorded through the injected release dependencies.
 */

const resolvers = {} as LinkResolvers

const blob = (name: string) =>
  ({
    $type: 'blob',
    ref: {$link: name},
    mimeType: 'video/mp4',
    size: 1,
  }) as unknown as BlobRef

function deferred<T = void>() {
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

function makeIdGenerator() {
  let i = 0
  return () => `id-${++i}`
}

afterEach(() => {
  mockIsWeb = false
  mockIsAndroid = false
})

describe('image outputs', () => {
  const output = (path: string): PickerImage => ({
    path,
    mime: 'image/jpeg',
    width: 100,
    height: 50,
    size: 10,
  })

  const media: PostMediaImage = {
    kind: 'image',
    id: 'image-1',
    postId: 'post-1',
    uri: 'file:///source.jpg',
    width: 200,
    height: 100,
    altText: '',
    upload: {state: 'pending'},
  }

  /** Runs the real image worker, reporting statuses and recorded releases. */
  function runImage(overrides: Partial<ImageUploadDependencies> = {}) {
    const statuses: string[] = []
    const released: string[] = []
    const releaseCompressedImage = jest.fn(({uri}: {uri: string}) => {
      released.push(uri)
    })
    const task = startImageUpload({
      ...testUploadRuntime,
      media,
      attempt: fakeUploadAttempt({
        reportStatus: ({status}) => {
          statuses.push(status.state)
        },
        reportFailure: () => {
          statuses.push('failed')
        },
      }),
      ...fakeImageDependencies({releaseCompressedImage, ...overrides}),
    })
    return {task, statuses, released, releaseCompressedImage}
  }

  test('is released once after a successful upload settles', async () => {
    const upload = deferred<{blob: BlobRef}>()
    const run = runImage({
      compressImage: () => Promise.resolve(output('file:///out.jpg')),
      uploadBlob: () => upload.promise,
    })
    await flush()
    expect(run.released).toEqual([])

    upload.resolve({blob: blob('up')})
    await flush()

    expect(run.statuses.at(-1)).toBe('uploaded')
    expect(run.released).toEqual(['file:///out.jpg'])
  })

  test('is released once after a failed upload', async () => {
    const run = runImage({
      compressImage: () => Promise.resolve(output('file:///out.jpg')),
      uploadBlob: () => Promise.reject(new Error('network')),
    })
    await flush()

    expect(run.statuses.at(-1)).toBe('failed')
    expect(run.released).toEqual(['file:///out.jpg'])
  })

  test('a compression that finishes after cancellation is released, not uploaded', async () => {
    const compression = deferred<PickerImage>()
    const uploadBlob = jest.fn<ImageUploadDependencies['uploadBlob']>()
    const run = runImage({
      compressImage: () => compression.promise,
      uploadBlob,
    })
    await flush()

    run.task.cancel()
    await flush()
    /* Compression is still reading its own scratch; nothing to release yet. */
    expect(run.released).toEqual([])

    compression.resolve(output('file:///late.jpg'))
    await flush()

    expect(uploadBlob).not.toHaveBeenCalled()
    expect(run.released).toEqual(['file:///late.jpg'])
    expect(run.statuses).not.toContain('failed')
  })

  test('is not released while an upload started before cancellation still runs', async () => {
    const upload = deferred<{blob: BlobRef}>()
    const run = runImage({
      compressImage: () => Promise.resolve(output('file:///out.jpg')),
      uploadBlob: () => upload.promise,
    })
    await flush()

    run.task.cancel()
    await flush()
    expect(run.released).toEqual([])

    upload.resolve({blob: blob('up')})
    await flush()

    expect(run.released).toEqual(['file:///out.jpg'])
    expect(run.statuses).not.toContain('uploaded')
  })

  test('is released when recording the result throws', async () => {
    const released: string[] = []
    const task = startImageUpload({
      ...testUploadRuntime,
      media,
      attempt: fakeUploadAttempt({
        setCompressionResult: () => {
          throw new Error('store failed')
        },
      }),
      ...fakeImageDependencies({
        compressImage: () => Promise.resolve(output('file:///out.jpg')),
        releaseCompressedImage: ({uri}) => {
          released.push(uri)
        },
      }),
    })
    await flush()

    expect(released).toEqual(['file:///out.jpg'])
    task.cancel()
  })

  test('a throwing or rejecting release changes no outcome', async () => {
    for (const release of [
      () => {
        throw new Error('delete failed')
      },
      () => Promise.reject(new Error('delete failed')),
    ]) {
      const run = runImage({
        compressImage: () => Promise.resolve(output('file:///out.jpg')),
        uploadBlob: () => Promise.resolve({blob: blob('up')}),
        releaseCompressedImage: release,
      })
      await flush()
      expect(run.statuses.at(-1)).toBe('uploaded')
    }
  })

  test('nothing is released when compression never produced an output', async () => {
    const run = runImage({
      compressImage: () => Promise.reject(new Error('compress failed')),
    })
    await flush()

    expect(run.statuses.at(-1)).toBe('failed')
    expect(run.releaseCompressedImage).not.toHaveBeenCalled()
  })

  describe('through the store', () => {
    function makeStore() {
      const released: string[] = []
      const compressions: Array<{
        source: string
        gate: ReturnType<typeof deferred<PickerImage>>
      }> = []
      const store = createThreadStore({
        ...testUploadRuntime,
        resolvers,
        __createId: makeIdGenerator(),
        __uploadWorkers: realUploadWorkers({
          image: {
            getImageDimensions: () => Promise.resolve({width: 10, height: 10}),
            compressImage: ({image}) => {
              const gate = deferred<PickerImage>()
              compressions.push({source: image.source.path, gate})
              return gate.promise
            },
            uploadBlob: () => Promise.resolve({blob: blob('up')}),
            releaseCompressedImage: ({uri}) => {
              released.push(uri)
            },
          },
        }),
      })
      const postId = Object.keys(store.getState().posts)[0]
      const [mediaId] = store.actions.addMedia(postId, [
        {kind: 'image', uri: 'file:///source.jpg', width: 200, height: 100},
      ])!.addedMediaIds
      const image = () =>
        getMediaItems({
          media: store.getState().posts[postId].attachments.media,
        })[0] as PostMediaImage
      return {store, postId, mediaId, released, compressions, image}
    }

    test('a successful upload keeps planning metadata but no output URI', async () => {
      const h = makeStore()
      await flush()
      h.compressions[0].gate.resolve(output('file:///out.jpg'))
      await flush()

      expect(h.image().upload.state).toBe('uploaded')
      expect(h.image().prepared).not.toHaveProperty('uri')
      expect(h.image().prepared).toMatchObject({
        width: 100,
        height: 50,
        mimeType: 'image/jpeg',
        aspectRatio: {width: 100, height: 50},
        size: 10,
      })
      expect(h.released).toEqual(['file:///out.jpg'])
    })

    test.each([
      {
        action: 'removal',
        act: (h: ReturnType<typeof makeStore>) =>
          h.store.actions.removeMedia(h.postId, h.mediaId),
      },
      {
        action: 'store destroy',
        act: (h: ReturnType<typeof makeStore>) => h.store.destroy(),
      },
    ])(
      'a compression that finishes after $action is released',
      async ({act}) => {
        const h = makeStore()
        await flush()
        act(h)
        await flush()
        expect(h.released).toEqual([])

        h.compressions[0].gate.resolve(output('file:///late.jpg'))
        await flush()

        expect(h.released).toEqual(['file:///late.jpg'])
      },
    )

    test('replaceImageSource releases only the stale output, never a source or supersededUri', async () => {
      const h = makeStore()
      await flush()
      const first = h.store.actions.replaceImageSource(h.postId, h.mediaId, {
        uri: 'file:///crop-1.jpg',
        width: 50,
        height: 50,
      })
      expect(first).toEqual({})
      const second = h.store.actions.replaceImageSource(h.postId, h.mediaId, {
        uri: 'file:///crop-2.jpg',
        width: 40,
        height: 40,
      })
      expect(second).toEqual({supersededUri: 'file:///crop-1.jpg'})

      h.compressions[0].gate.resolve(output('file:///stale-out.jpg'))
      await flush()
      /* The first replacement queued nothing; the current attempt runs next. */
      h.compressions.at(-1)!.gate.resolve(output('file:///current-out.jpg'))
      await flush()

      expect(h.released.sort()).toEqual([
        'file:///current-out.jpg',
        'file:///stale-out.jpg',
      ])
      expect(h.released).not.toContain('file:///source.jpg')
      expect(h.released).not.toContain('file:///crop-1.jpg')
      expect(h.image().uri).toBe('file:///crop-2.jpg')
    })

    test('stores release only their own outputs', async () => {
      const a = makeStore()
      const b = makeStore()
      await flush()

      a.store.destroy()
      a.compressions[0].gate.resolve(output('file:///a-out.jpg'))
      b.compressions[0].gate.resolve(output('file:///b-out.jpg'))
      await flush()

      expect(a.released).toEqual(['file:///a-out.jpg'])
      expect(b.released).toEqual(['file:///b-out.jpg'])
    })
  })
})

describe('native encoded video outputs', () => {
  const source = {
    uri: 'file:///tmp/a.mp4',
    width: 1920,
    height: 1080,
    mimeType: 'video/mp4',
    fileSize: 2048,
    duration: 3,
  }
  const encoded: CompressedVideo = {
    uri: 'file:///tmp/encoded.mp4',
    size: 1024,
    mimeType: 'video/mp4',
  }
  const completed = {
    state: 'JOB_STATE_COMPLETED',
    jobId: 'job-1',
    blob: blob('video'),
  } as never

  function makeStore(video: Partial<VideoUploadDependencies> = {}) {
    const released: string[] = []
    const copies: string[] = []
    const {analytics} = fakeAnalytics()
    const createTelemetry = jest.fn<
      VideoUploadDependencies['createVideoTelemetry']
    >(args => createVideoTelemetry(args))
    const store = createThreadStore({
      ...testUploadRuntime,
      analytics,
      resolvers,
      __createId: makeIdGenerator(),
      __uploadWorkers: realUploadWorkers({
        video: {
          createVideoTelemetry: createTelemetry,
          getVideoMetadata: () => Promise.resolve(source),
          getFileSize: () => Promise.resolve(encoded.size),
          copyVideoToCache: () => {
            const uri = 'file:///cache/copy.mp4'
            return Promise.resolve({uri, release: () => copies.push(uri)})
          },
          compressVideo: () => Promise.resolve(encoded),
          uploadVideo: () => Promise.resolve(completed),
          releaseCompressedVideo: ({uri}) => {
            released.push(uri)
          },
          ...video,
        },
      }),
    })
    const postId = Object.keys(store.getState().posts)[0]
    return {
      store,
      postId,
      released,
      copies,
      createTelemetry,
      add(input: Record<string, unknown> = {}) {
        return store.actions.addMedia(postId, [
          {kind: 'video', uri: source.uri, ...input},
        ])!.addedMediaIds[0]
      },
      video(mediaId: string) {
        return getMediaItems({
          media: store.getState().posts[postId].attachments.media,
        }).find(item => item.id === mediaId) as PostMediaVideo
      },
    }
  }

  /** Rejects with AbortError when the attempt is cancelled, like the real one. */
  const pendingUntilAborted = () =>
    jest.fn<VideoUploadDependencies['uploadVideo']>(
      ({signal}) =>
        new Promise((_, reject) => {
          signal.addEventListener('abort', () => reject(new AbortError()))
        }),
    )

  const failFirstUpload = () =>
    jest
      .fn<VideoUploadDependencies['uploadVideo']>()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValue(completed)

  test('a retained output survives a failed upload and is deleted once the blob supersedes it', async () => {
    const h = makeStore({uploadVideo: failFirstUpload()})
    const mediaId = h.add()
    await flush()
    expect(h.video(mediaId).upload.state).toBe('failed')
    expect(h.released).toEqual([])

    h.store.actions.retryMediaUpload(h.postId, mediaId)
    await flush()

    expect(h.video(mediaId).upload.state).toBe('uploaded')
    expect(h.released).toEqual([encoded.uri])
    h.store.destroy()
    expect(h.released).toEqual([encoded.uri])
  })

  test('the prepared state keeps planning metadata without the output URI', async () => {
    const h = makeStore()
    const mediaId = h.add()
    await flush()

    expect(h.released).toEqual([encoded.uri])
    expect(h.video(mediaId).prepared).not.toHaveProperty('uri')
    expect(h.video(mediaId).prepared).toMatchObject({
      size: 1024,
      mimeType: 'video/mp4',
      width: 1920,
      height: 1080,
      aspectRatio: {width: 1920, height: 1080},
    })
  })

  test('a reader still uploading keeps the output until it settles', async () => {
    const upload = deferred<never>()
    const h = makeStore({uploadVideo: () => upload.promise})
    const mediaId = h.add()
    await flush()

    h.store.actions.removeMedia(h.postId, mediaId)
    await flush()
    expect(h.released).toEqual([])

    upload.reject(new AbortError())
    await flush()
    expect(h.released).toEqual([encoded.uri])
  })

  test.each([
    {
      action: 'clearing the attachment',
      act: (h: ReturnType<typeof makeStore>) =>
        h.store.actions.removeMediaAttachment(h.postId),
    },
    {
      action: 'removing its post',
      act: (h: ReturnType<typeof makeStore>) => {
        h.store.actions.addPost('after', h.postId)
        h.store.actions.removePost(h.postId)
      },
    },
    {
      action: 'destroying the store',
      act: (h: ReturnType<typeof makeStore>) => h.store.destroy(),
    },
  ])('$action deletes a retained output once', async ({act}) => {
    const h = makeStore({uploadVideo: pendingUntilAborted()})
    h.add()
    await flush()
    expect(h.released).toEqual([])

    act(h)
    await flush()

    expect(h.released).toEqual([encoded.uri])
  })

  test('a compression that finishes after removal is deleted once its worker settles', async () => {
    const compression = deferred<CompressedVideo>()
    const h = makeStore({compressVideo: () => compression.promise})
    const mediaId = h.add()
    await flush()

    h.store.actions.removeMedia(h.postId, mediaId)
    await flush()
    expect(h.released).toEqual([])

    compression.resolve(encoded)
    await flush()
    expect(h.released).toEqual([encoded.uri])
  })

  test('an oversized output is deleted without being uploaded', async () => {
    const uploadVideo = jest.fn<VideoUploadDependencies['uploadVideo']>()
    const h = makeStore({
      uploadVideo,
      compressVideo: () =>
        Promise.resolve({...encoded, size: VIDEO_MAX_SIZE + 1}),
    })
    const mediaId = h.add()
    await flush()

    expect(h.video(mediaId).upload.state).toBe('failed')
    expect(uploadVideo).not.toHaveBeenCalled()
    expect(h.released).toEqual([encoded.uri])
  })

  test('a throwing or rejecting delete changes no outcome', async () => {
    for (const release of [
      () => {
        throw new Error('delete failed')
      },
      () => Promise.reject(new Error('delete failed')),
    ]) {
      const h = makeStore({releaseCompressedVideo: release})
      const mediaId = h.add()
      await flush()
      expect(h.video(mediaId).upload.state).toBe('uploaded')
    }
  })

  test.each([
    {
      name: 'a passthrough result',
      output: {
        uri: source.uri,
        size: 1024,
        mimeType: 'video/mp4',
        passthroughReason: 'below-byte-threshold',
      } as CompressedVideo,
    },
    {
      name: 'a GIF',
      output: {
        uri: 'file:///tmp/a.gif',
        size: 10,
        mimeType: 'image/gif',
        passthroughReason: 'gif',
      } as CompressedVideo,
    },
  ])('$name is never deleted', async ({output}) => {
    const h = makeStore({compressVideo: () => Promise.resolve(output)})
    const mediaId = h.add()
    await flush()

    expect(h.video(mediaId).upload.state).toBe('uploaded')
    h.store.destroy()
    expect(h.released).toEqual([])
  })

  test('web output is never deleted', async () => {
    mockIsWeb = true
    const h = makeStore({
      compressVideo: () =>
        Promise.resolve({
          uri: 'blob:original',
          size: 3,
          mimeType: 'video/mp4',
          bytes: new Uint8Array([1, 2, 3]).buffer,
        }),
    })
    const mediaId = h.add({
      width: 1920,
      height: 1080,
      mimeType: 'video/mp4',
      duration: 3,
      fileSize: 3,
    })
    await flush()

    expect(h.video(mediaId).upload.state).toBe('uploaded')
    h.store.destroy()
    expect(h.released).toEqual([])
  })

  test('the Android copy and the encoded output are each released exactly once', async () => {
    mockIsAndroid = true
    const h = makeStore()
    h.add({mimeType: 'video/mp4', localRefPath: 'draft-video'})
    await flush()
    h.store.destroy()

    expect(h.copies).toEqual(['file:///cache/copy.mp4'])
    expect(h.released).toEqual([encoded.uri])
  })

  test('stores delete only their own outputs', async () => {
    const aUpload = deferred<never>()
    const a = makeStore({
      uploadVideo: () => aUpload.promise,
      compressVideo: () => Promise.resolve({...encoded, uri: 'file:///a.mp4'}),
    })
    const b = makeStore({
      compressVideo: () => Promise.resolve({...encoded, uri: 'file:///b.mp4'}),
    })
    a.add()
    b.add()
    await flush()

    expect(b.released).toEqual(['file:///b.mp4'])
    a.store.destroy()
    aUpload.reject(new AbortError())
    await flush()
    expect(a.released).toEqual(['file:///a.mp4'])
    expect(b.released).toEqual(['file:///b.mp4'])
  })

  test('telemetry receives scalar source metadata but no File or Blob', async () => {
    const file = new File(['x'], 'v.mp4', {type: 'video/mp4'})
    mockIsWeb = true
    const h = makeStore({
      compressVideo: () =>
        Promise.resolve({
          uri: 'blob:original',
          size: 1,
          mimeType: 'video/mp4',
          bytes: new ArrayBuffer(1),
        }),
    })
    h.add({
      file,
      width: 1920,
      height: 1080,
      mimeType: 'video/mp4',
      duration: 3,
      fileSize: 1,
    })
    await flush()

    const [{asset}] = h.createTelemetry.mock.calls[0]
    expect(asset).toEqual({
      uri: source.uri,
      width: 1920,
      height: 1080,
      mimeType: 'video/mp4',
      duration: 3,
      fileSize: 1,
    })
    expect(asset).not.toHaveProperty('file')
  })

  test('publication is still reported after the video is removed', async () => {
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
          getFileSize: () => Promise.resolve(encoded.size),
          compressVideo: () => Promise.resolve(encoded),
          uploadVideo: () => Promise.resolve(completed),
        },
      }),
    })
    const postId = Object.keys(store.getState().posts)[0]
    const [mediaId] = store.actions.addMedia(postId, [
      {kind: 'video', uri: source.uri},
    ])!.addedMediaIds
    await flush()
    const plan = {
      posts: [
        {
          postId,
          record: {
            embed: {
              $type: 'app.bsky.embed.video',
              video: (
                getMediaItems({
                  media: store.getState().posts[postId].attachments.media,
                })[0] as PostMediaVideo
              ).videoBlob,
            },
          },
        },
      ],
    } as unknown as ComposerV2Plan

    store.actions.removeMedia(postId, mediaId)
    store.reportPublished({plan})

    expect(metric.mock.calls.map(([event]) => event)).toContain(
      'video:upload:published',
    )
    store.destroy()
  })
})
