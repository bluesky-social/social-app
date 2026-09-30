import {type ImagePickerAsset} from 'expo-image-picker'
import {afterEach, describe, expect, jest, test} from '@jest/globals'

let mockIsWeb = false
jest.mock('#/env', () =>
  /* A getter keeps IS_WEB live; object spread would copy its current value. */
  Object.defineProperty({...jest.requireActual<object>('#/env')}, 'IS_WEB', {
    get: () => mockIsWeb,
  }),
)
/* Avoid loading the UI module chain through the real link resolver. */
jest.mock('#/lib/api/resolve', () => ({resolveLink: jest.fn()}))

import {type LinkResolvers} from '#/lib/api/resolve'
import {pastedMediaToInput} from '#/components/ComposerV2/adapters/pastedMedia'
import {createThreadStore} from '#/components/ComposerV2/store'
import {
  type AddMediaInput,
  type PostMediaItem,
  type ThreadStoreInitialState,
} from '#/components/ComposerV2/store/types'
import {
  type ImageUploadDependencies,
  type VideoUploadDependencies,
} from '#/components/ComposerV2/store/uploads'
import {realUploadWorkers, testUploadRuntime} from './uploadTestUtils'

const resolvers = {} as LinkResolvers

async function settle() {
  for (let i = 0; i < 20; i++) await Promise.resolve()
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(r => (resolve = r))
  return {promise, resolve}
}

function makeStore({
  image,
  video,
  initialState,
}: {
  image?: Partial<ImageUploadDependencies>
  video?: Partial<VideoUploadDependencies>
  initialState?: ThreadStoreInitialState
}) {
  let i = 0
  return createThreadStore({
    ...testUploadRuntime,
    resolvers,
    initialState,
    __createId: () => `id-${++i}`,
    __uploadWorkers: realUploadWorkers({image, video}),
  })
}

function rootId(store: ReturnType<typeof createThreadStore>) {
  return Object.keys(store.getState().posts)[0]
}

function getMedia(
  store: ReturnType<typeof createThreadStore>,
  postId: string,
): PostMediaItem[] {
  const media = store.getState().posts[postId].attachments.media
  if (media?.state !== 'resolved') return []
  if (media.kind === 'images') return media.items
  if (media.kind === 'video' || media.kind === 'gif') return [media.item]
  return []
}

function probed(overrides: Partial<ImagePickerAsset> = {}): ImagePickerAsset {
  return {
    uri: 'file:///a.mp4',
    mimeType: 'video/mp4',
    width: 1920,
    height: 1080,
    duration: 2000,
    fileSize: 50_000_000,
    ...overrides,
  }
}

const compressed = {
  path: 'file:///compressed.jpg',
  width: 10,
  height: 10,
  mime: 'image/jpeg',
  size: 1,
}

const videoInput: AddMediaInput = {
  kind: 'video',
  uri: 'file:///a.mp4',
  width: 1920,
  height: 1080,
  mimeType: 'video/mp4',
}

afterEach(() => {
  mockIsWeb = false
  jest.restoreAllMocks()
})

describe('resolved source metadata ownership', () => {
  test('a retry of the same item reuses metadata instead of probing again', async () => {
    const getVideoMetadata = jest.fn(() => Promise.resolve(probed()))
    const compressVideo = jest
      .fn<VideoUploadDependencies['compressVideo']>()
      .mockRejectedValueOnce(new Error('compression failed'))
      .mockResolvedValue({uri: 'file:///c.mp4', size: 1, mimeType: 'video/mp4'})
    const uploadVideo = jest.fn(() => new Promise<never>(() => {}))
    const store = makeStore({
      video: {getVideoMetadata, compressVideo, uploadVideo},
    })
    const root = rootId(store)
    store.actions.addMedia(root, [videoInput])
    await settle()

    const [failed] = getMedia(store, root)
    expect(failed).toMatchObject({
      duration: 2000,
      fileSize: 50_000_000,
      upload: {state: 'failed', retryable: true},
    })
    store.actions.retryMediaUpload(root, failed.id)
    await settle()

    expect(getVideoMetadata).toHaveBeenCalledTimes(1)
    expect(compressVideo).toHaveBeenCalledTimes(2)
    expect(compressVideo.mock.calls[1][0]).toMatchObject({
      duration: 2000,
      fileSize: 50_000_000,
    })
    store.destroy()
  })

  test('initial media preparation does not dirty a restored composition', async () => {
    const store = makeStore({
      video: {
        getVideoMetadata: () => Promise.resolve(probed()),
        compressVideo: () => new Promise(() => {}),
      },
      initialState: {
        isDirty: false,
        posts: [
          {
            attachments: {
              media: {
                kind: 'video',
                item: {uri: 'file:///a.mp4', width: 1920, height: 1080},
              },
            },
          },
        ],
      },
    })
    await settle()

    expect(getMedia(store, rootId(store))[0]).toMatchObject({
      mimeType: 'video/mp4',
      duration: 2000,
    })
    expect(store.getState().isDirty).toBe(false)
    store.destroy()
  })

  test('a probe that settles after removal changes nothing and never compresses', async () => {
    const probe = deferred<ImagePickerAsset>()
    const compressVideo = jest.fn<VideoUploadDependencies['compressVideo']>()
    const store = makeStore({
      video: {getVideoMetadata: () => probe.promise, compressVideo},
    })
    const root = rootId(store)
    const {addedMediaIds} = store.actions.addMedia(root, [videoInput])!
    store.actions.removeMedia(root, addedMediaIds[0])
    const after = store.getState()

    probe.resolve(probed())
    await settle()

    expect(store.getState()).toBe(after)
    expect(compressVideo).not.toHaveBeenCalled()
    store.destroy()
  })

  test('a replaced source keeps its own metadata when the old probe settles late', async () => {
    const probes = [deferred<ImagePickerAsset>(), deferred<ImagePickerAsset>()]
    let call = 0
    const getVideoMetadata = jest.fn(() => probes[call++].promise)
    const compressVideo = jest.fn<VideoUploadDependencies['compressVideo']>(
      () => new Promise(() => {}),
    )
    const store = makeStore({video: {getVideoMetadata, compressVideo}})
    const root = rootId(store)
    store.actions.addMedia(root, [videoInput])
    store.actions.removeMediaAttachment(root)
    store.actions.addMedia(root, [{...videoInput, uri: 'file:///b.mp4'}])

    probes[1].resolve(probed({uri: 'file:///b.mp4', duration: 222}))
    await settle()
    probes[0].resolve(probed({duration: 111}))
    await settle()

    const [item] = getMedia(store, root)
    expect(item).toMatchObject({uri: 'file:///b.mp4', duration: 222})
    expect(compressVideo).toHaveBeenCalledTimes(1)
    expect(compressVideo.mock.calls[0][0]).toMatchObject({
      uri: 'file:///b.mp4',
    })
    store.destroy()
  })
})

describe('pasted and dropped sources through the store', () => {
  test('web: pasted data URIs keep their type and the image selection limit applies', async () => {
    mockIsWeb = true
    const getImageDimensions = jest.fn(() =>
      Promise.resolve({width: 50, height: 40}),
    )
    const compressImage = jest.fn(() => Promise.resolve(compressed))
    const store = makeStore({
      image: {
        getImageDimensions,
        compressImage,
        uploadBlob: () => new Promise(() => {}),
      },
    })
    const root = rootId(store)
    const pasted = Array.from(
      {length: 12},
      (_, i) => `data:image/png;base64,${i}`,
    )
    const inputs = pasted.flatMap(source => {
      const input = pastedMediaToInput({source})
      return input ? [input] : []
    })
    const {addedMediaIds} = store.actions.addMedia(root, inputs)!
    await settle()

    expect(addedMediaIds).toHaveLength(10)
    const items = getMedia(store, root)
    expect(items.map(item => item.kind === 'image' && item.mimeType)).toEqual(
      Array(10).fill('image/png'),
    )
    expect(getImageDimensions).toHaveBeenCalledTimes(10)
    expect(compressImage).toHaveBeenCalledTimes(10)
    store.destroy()
  })

  test('native: a pasted file URI is prepared as an image without a MIME guess', async () => {
    const getImageDimensions = jest.fn(() =>
      Promise.resolve({width: 50, height: 40}),
    )
    const compressImage = jest.fn(() => Promise.resolve(compressed))
    const uploadBlob = jest.fn(() => new Promise<never>(() => {}))
    const store = makeStore({
      image: {getImageDimensions, compressImage, uploadBlob},
    })
    const root = rootId(store)
    const input = pastedMediaToInput({source: 'file:///tmp/pasted.webp'})!
    store.actions.addMedia(root, [input])
    await settle()

    expect(getMedia(store, root)[0]).toMatchObject({
      uri: 'file:///tmp/pasted.webp',
      width: 50,
      height: 40,
      mimeType: undefined,
    })
    expect(uploadBlob).toHaveBeenCalledWith(
      testUploadRuntime.pdsClient,
      'file:///compressed.jpg',
      'image/jpeg',
    )
    store.destroy()
  })
})
