import {type ImagePickerAsset} from 'expo-image-picker'
import {type BlobRef} from '@atproto/lex'
import {afterEach, describe, expect, jest, test} from '@jest/globals'

let mockIsWeb = false
let mockIsAndroid = false
jest.mock('#/env', () =>
  /* Getters keep the flags live; object spread would copy current values. */
  Object.defineProperties(
    {...jest.requireActual<object>('#/env')},
    {
      IS_WEB: {get: () => mockIsWeb},
      IS_ANDROID: {get: () => mockIsAndroid},
    },
  ),
)
/* Avoid loading the UI module chain through the real link resolver. */
jest.mock('#/lib/api/resolve', () => ({resolveLink: jest.fn()}))

import {type LinkResolvers} from '#/lib/api/resolve'
import {AbortError} from '#/lib/async/cancelable'
import {draftToInitialState} from '#/components/ComposerV2/adapters'
import {createThreadStore} from '#/components/ComposerV2/store'
import {
  type ImageUploadDependencies,
  type VideoUploadDependencies,
} from '#/components/ComposerV2/store/uploads'
import {type app} from '#/lexicons'
import {realUploadWorkers, testUploadRuntime} from './uploadTestUtils'

/*
 * Restored draft media from the inbound adapter through the store into the real
 * upload workers. Only the platform helpers are fakes, and the metadata fake
 * enforces the real helper's argument shape for the current platform.
 */

const resolvers = {} as LinkResolvers

const blob = (name: string) =>
  ({
    $type: 'blob',
    ref: {$link: name},
    mimeType: 'video/mp4',
    size: 1,
  }) as unknown as BlobRef

async function settle() {
  for (let i = 0; i < 30; i++) await Promise.resolve()
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(r => (resolve = r))
  return {promise, resolve}
}

/** Mirrors the platform split in `view/com/composer/videos/metadata`. */
function strictVideoMetadata(result: Partial<ImagePickerAsset> = {}) {
  return jest.fn<VideoUploadDependencies['getVideoMetadata']>(
    (source: File | string, fallbackMimeType?: string) => {
      if (mockIsWeb && typeof source === 'string') {
        return Promise.reject(new Error('web metadata needs a File'))
      }
      if (!mockIsWeb && typeof source !== 'string') {
        return Promise.reject(new Error('native metadata needs a URI'))
      }
      return Promise.resolve({
        uri: typeof source === 'string' ? source : 'data:video/mp4;base64,',
        mimeType: fallbackMimeType ?? 'video/mp4',
        width: 1280,
        height: 720,
        duration: 4000,
        fileSize: 1234,
        ...result,
      })
    },
  )
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

function videoDraft({
  path = 'video:video/mp4:one',
  captions = [{lang: 'en', content: 'WEBVTT'}],
}: {
  path?: string
  captions?: Array<{lang: string; content: string}>
} = {}): app.bsky.draft.defs.Draft {
  return {
    langs: ['en'],
    posts: [
      {text: 'first'},
      {
        text: 'second',
        embedVideos: [{localRef: {path}, alt: 'restored alt', captions}],
      },
    ],
  }
}

function imageDraft(): app.bsky.draft.defs.Draft {
  return {
    posts: [
      {
        text: 'images',
        embedImages: [
          {
            $type: 'app.bsky.draft.defs#draftEmbedImage',
            localRef: {path: 'image:one'},
            alt: 'image alt',
          },
        ],
      },
    ],
  }
}

async function restore({
  draft,
  loadedMedia,
  image,
  video,
}: {
  draft: app.bsky.draft.defs.Draft
  loadedMedia: Map<string, string>
  image?: Partial<ImageUploadDependencies>
  video?: Partial<VideoUploadDependencies>
}) {
  const initialState = await draftToInitialState({
    draftId: 'draft-1',
    draft,
    loadedMedia,
  })
  let id = 0
  const store = createThreadStore({
    ...testUploadRuntime,
    resolvers,
    initialState,
    __createId: () => `id-${++id}`,
    __uploadWorkers: realUploadWorkers({image, video}),
  })
  return store
}

function lastPost(store: ReturnType<typeof createThreadStore>) {
  const {posts} = store.getState()
  const ids = Object.keys(posts)
  return {postId: ids[ids.length - 1], post: posts[ids[ids.length - 1]]}
}

function restoredVideo(store: ReturnType<typeof createThreadStore>) {
  const media = lastPost(store).post.attachments.media
  if (media?.state !== 'resolved' || media.kind !== 'video') {
    throw new Error('expected a restored video')
  }
  return media.item
}

function restoredImage(store: ReturnType<typeof createThreadStore>) {
  const media = lastPost(store).post.attachments.media
  if (media?.state !== 'resolved' || media.kind !== 'images') {
    throw new Error('expected restored images')
  }
  return media.items[0]
}

afterEach(() => {
  mockIsWeb = false
  mockIsAndroid = false
  jest.restoreAllMocks()
})

describe('web: restored object URLs', () => {
  test('a video is fetched once into a File for the probe and compressor, keeping draft data', async () => {
    mockIsWeb = true
    const url = 'blob:https://bsky.app/restored-video'
    const stored = new Blob(['video bytes'], {type: 'video/webm'})
    const fetchSpy = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({blob: () => Promise.resolve(stored)} as Response)
    const revokeSpy = jest.spyOn(URL, 'revokeObjectURL')
    const getVideoMetadata = strictVideoMetadata()
    const compressVideo = jest.fn<VideoUploadDependencies['compressVideo']>(
      () => new Promise(() => {}),
    )
    const store = await restore({
      draft: videoDraft({path: 'video:video/webm:one'}),
      loadedMedia: new Map([['video:video/webm:one', url]]),
      video: {getVideoMetadata, compressVideo},
    })
    await settle()

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(fetchSpy).toHaveBeenCalledWith(url)
    const [probedFile, fallbackMimeType] = getVideoMetadata.mock.calls[0]
    expect(probedFile).toBeInstanceOf(File)
    expect((probedFile as File).type).toBe('video/webm')
    expect(fallbackMimeType).toBe('video/webm')
    /* The compressor reads the same File rather than fetching again. */
    expect(compressVideo.mock.calls[0][0].file).toBe(probedFile)
    expect(revokeSpy).not.toHaveBeenCalled()

    expect(restoredVideo(store)).toMatchObject({
      uri: url,
      localRefPath: 'video:video/webm:one',
      mimeType: 'video/webm',
      width: 1280,
      height: 720,
      duration: 4000,
      altText: 'restored alt',
      captions: [{lang: 'en', content: 'WEBVTT'}],
    })
    expect(store.getState()).toMatchObject({draftId: 'draft-1', isDirty: false})
    expect(
      Object.values(store.getState().posts).map(post => post.text),
    ).toEqual(['first', 'second'])
    store.destroy()
  })

  test('an image object URL reaches the image loader and compressor without a fetch', async () => {
    mockIsWeb = true
    const url = 'blob:https://bsky.app/restored-image'
    const fetchSpy = jest.spyOn(globalThis, 'fetch')
    const getImageDimensions = jest.fn(() =>
      Promise.resolve({width: 300, height: 200}),
    )
    const compressImage = jest.fn<ImageUploadDependencies['compressImage']>(
      () => new Promise(() => {}),
    )
    const store = await restore({
      draft: imageDraft(),
      loadedMedia: new Map([['image:one', url]]),
      image: {getImageDimensions, compressImage},
    })
    await settle()

    expect(getImageDimensions).toHaveBeenCalledWith(url)
    expect(compressImage.mock.calls[0][0].image.source).toMatchObject({
      path: url,
      width: 300,
      height: 200,
    })
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(restoredImage(store)).toMatchObject({
      uri: url,
      width: 300,
      height: 200,
      altText: 'image alt',
      localRefPath: 'image:one',
    })
    expect(store.getState().isDirty).toBe(false)
    store.destroy()
  })
})

describe('android: restored draft videos', () => {
  test('the probe and compressor read an attempt-owned copy; the item keeps its durable source', async () => {
    mockIsAndroid = true
    const durable = 'file:///docs/bsky-draft-media/video%253Avideo%252Fmp4'
    const {copyVideoToCache, released} = fakeCopy()
    const getVideoMetadata = strictVideoMetadata()
    const compressVideo = jest.fn<VideoUploadDependencies['compressVideo']>(
      asset =>
        Promise.resolve({uri: asset.uri, size: 1234, mimeType: 'video/mp4'}),
    )
    const uploadVideo = pendingUntilAborted()
    const store = await restore({
      draft: videoDraft(),
      loadedMedia: new Map([['video:video/mp4:one', durable]]),
      video: {copyVideoToCache, getVideoMetadata, compressVideo, uploadVideo},
    })
    await settle()

    expect(copyVideoToCache).toHaveBeenCalledWith({
      uri: durable,
      mimeType: 'video/mp4',
    })
    expect(getVideoMetadata).toHaveBeenCalledWith(
      'file:///cache/copy-1.mp4',
      'video/mp4',
    )
    expect(compressVideo.mock.calls[0][0].uri).toBe('file:///cache/copy-1.mp4')
    /* A pass-through returns the copy's URI, so it lives until upload settles. */
    expect(uploadVideo.mock.calls[0][0].video.uri).toBe(
      'file:///cache/copy-1.mp4',
    )
    expect(released).toEqual([])
    expect(restoredVideo(store)).toMatchObject({
      uri: durable,
      localRefPath: 'video:video/mp4:one',
      width: 1280,
      height: 720,
    })
    expect(store.getState().isDirty).toBe(false)

    store.destroy()
    await settle()
    expect(released).toEqual(['file:///cache/copy-1.mp4'])
  })

  test('a retry makes a fresh copy, reuses metadata, and releases each copy', async () => {
    mockIsAndroid = true
    const durable = 'file:///docs/bsky-draft-media/restored'
    const {copyVideoToCache, released} = fakeCopy()
    const getVideoMetadata = strictVideoMetadata()
    const compressVideo = jest
      .fn<VideoUploadDependencies['compressVideo']>()
      .mockRejectedValueOnce(new Error('compression failed'))
      .mockResolvedValue({
        uri: 'file:///compressed.mp4',
        size: 1,
        mimeType: 'video/mp4',
      })
    const uploadVideo = jest.fn<VideoUploadDependencies['uploadVideo']>(() =>
      Promise.resolve({
        state: 'JOB_STATE_COMPLETED',
        jobId: 'job-1',
        blob: blob('video'),
      } as never),
    )
    const store = await restore({
      draft: videoDraft({captions: []}),
      loadedMedia: new Map([['video:video/mp4:one', durable]]),
      video: {copyVideoToCache, getVideoMetadata, compressVideo, uploadVideo},
    })
    await settle()

    const failed = restoredVideo(store)
    expect(failed.upload).toMatchObject({state: 'failed', retryable: true})
    expect(released).toEqual(['file:///cache/copy-1.mp4'])

    store.actions.retryMediaUpload(lastPost(store).postId, failed.id)
    await settle()

    expect(copyVideoToCache).toHaveBeenCalledTimes(2)
    expect(copyVideoToCache.mock.calls[1][0].uri).toBe(durable)
    expect(getVideoMetadata).toHaveBeenCalledTimes(1)
    expect(compressVideo.mock.calls[1][0]).toMatchObject({
      uri: 'file:///cache/copy-2.mp4',
      duration: 4000,
    })
    expect(restoredVideo(store).upload.state).toBe('uploaded')
    expect(released).toEqual([
      'file:///cache/copy-1.mp4',
      'file:///cache/copy-2.mp4',
    ])
    expect(restoredVideo(store).uri).toBe(durable)
    store.destroy()
  })

  test('a copy that finishes after disposal is released without probing', async () => {
    mockIsAndroid = true
    const copy = deferred<{uri: string; release: () => void}>()
    const release = jest.fn()
    const getVideoMetadata = strictVideoMetadata()
    const store = await restore({
      draft: videoDraft(),
      loadedMedia: new Map([['video:video/mp4:one', 'file:///durable']]),
      video: {copyVideoToCache: () => copy.promise, getVideoMetadata},
    })
    store.destroy()

    copy.resolve({uri: 'file:///cache/late.mp4', release})
    await settle()

    expect(release).toHaveBeenCalledTimes(1)
    expect(getVideoMetadata).not.toHaveBeenCalled()
  })

  test('removing the video during upload releases its copy', async () => {
    mockIsAndroid = true
    const {copyVideoToCache, released} = fakeCopy()
    const store = await restore({
      draft: videoDraft(),
      loadedMedia: new Map([['video:video/mp4:one', 'file:///durable']]),
      video: {
        copyVideoToCache,
        getVideoMetadata: strictVideoMetadata(),
        compressVideo: asset =>
          Promise.resolve({uri: asset.uri, size: 1, mimeType: 'video/mp4'}),
        uploadVideo: pendingUntilAborted(),
      },
    })
    await settle()
    expect(released).toEqual([])

    store.actions.removeMediaAttachment(lastPost(store).postId)
    await settle()
    expect(released).toEqual(['file:///cache/copy-1.mp4'])
    store.destroy()
  })

  test('a restored GIF uses the copy for dimensions and size, never the video probe', async () => {
    mockIsAndroid = true
    const {copyVideoToCache} = fakeCopy()
    const getImageDimensions = jest.fn(() =>
      Promise.resolve({width: 320, height: 240}),
    )
    const getFileSize = jest.fn(() => Promise.resolve(2048))
    const compressVideo = jest.fn<VideoUploadDependencies['compressVideo']>(
      () => new Promise(() => {}),
    )
    const store = await restore({
      draft: videoDraft({path: 'video:image/gif:one'}),
      loadedMedia: new Map([['video:image/gif:one', 'file:///durable-gif']]),
      video: {copyVideoToCache, getImageDimensions, getFileSize, compressVideo},
    })
    await settle()

    expect(copyVideoToCache).toHaveBeenCalledWith({
      uri: 'file:///durable-gif',
      mimeType: 'image/gif',
    })
    expect(getImageDimensions).toHaveBeenCalledWith('file:///cache/copy-1.mp4')
    expect(getFileSize).toHaveBeenCalledWith('file:///cache/copy-1.mp4')
    expect(compressVideo.mock.calls[0][0]).toMatchObject({
      mimeType: 'image/gif',
      fileSize: 2048,
      width: 320,
      height: 240,
    })
    store.destroy()
  })
})

describe('ios: restored draft media', () => {
  test('a restored GIF is prepared from the durable URI without the video probe', async () => {
    const getImageDimensions = jest.fn(() =>
      Promise.resolve({width: 320, height: 240}),
    )
    const getFileSize = jest.fn(() => Promise.resolve(2048))
    const compressVideo = jest.fn<VideoUploadDependencies['compressVideo']>(
      () => new Promise(() => {}),
    )
    /* getVideoMetadata and copyVideoToCache stay strict fakes that throw. */
    const store = await restore({
      draft: videoDraft({path: 'video:image/gif:one'}),
      loadedMedia: new Map([['video:image/gif:one', 'file:///durable-gif']]),
      video: {getImageDimensions, getFileSize, compressVideo},
    })
    await settle()

    expect(getImageDimensions).toHaveBeenCalledWith('file:///durable-gif')
    expect(getFileSize).toHaveBeenCalledWith('file:///durable-gif')
    expect(compressVideo.mock.calls[0][0]).toMatchObject({
      uri: 'file:///durable-gif',
      mimeType: 'image/gif',
      fileSize: 2048,
    })
    store.destroy()
  })

  test('a restored video is probed by URI without a copy', async () => {
    const getVideoMetadata = strictVideoMetadata()
    const store = await restore({
      draft: videoDraft(),
      loadedMedia: new Map([['video:video/mp4:one', 'file:///durable.mp4']]),
      video: {getVideoMetadata, compressVideo: () => new Promise(() => {})},
    })
    await settle()

    expect(getVideoMetadata).toHaveBeenCalledWith(
      'file:///durable.mp4',
      'video/mp4',
    )
    store.destroy()
  })

  test('an image metadata failure is a retryable upload failure, not a dropped image', async () => {
    const getImageDimensions = jest
      .fn<ImageUploadDependencies['getImageDimensions']>()
      .mockRejectedValueOnce(new Error('unreadable'))
      .mockResolvedValue({width: 30, height: 20})
    const compressImage = jest.fn<ImageUploadDependencies['compressImage']>(
      () => new Promise(() => {}),
    )
    const store = await restore({
      draft: imageDraft(),
      loadedMedia: new Map([['image:one', 'file:///durable.jpg']]),
      image: {getImageDimensions, compressImage},
    })
    await settle()

    const failed = restoredImage(store)
    expect(failed).toMatchObject({
      uri: 'file:///durable.jpg',
      localRefPath: 'image:one',
      altText: 'image alt',
      upload: {state: 'failed', retryable: true},
    })
    expect(compressImage).not.toHaveBeenCalled()
    expect(store.getState().isDirty).toBe(false)

    store.actions.retryMediaUpload(lastPost(store).postId, failed.id)
    await settle()
    expect(getImageDimensions).toHaveBeenCalledTimes(2)
    expect(compressImage.mock.calls[0][0].image.source).toMatchObject({
      path: 'file:///durable.jpg',
      width: 30,
      height: 20,
    })
    store.destroy()
  })
})
