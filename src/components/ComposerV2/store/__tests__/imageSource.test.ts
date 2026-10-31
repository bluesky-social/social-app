import {describe, expect, jest, test} from '@jest/globals'

/* Avoid loading the UI module chain through the real link resolver. */
jest.mock('#/lib/api/resolve', () => ({resolveLink: jest.fn()}))

import {type BlobRef} from '@atproto/lex'

import {type LinkResolvers} from '#/lib/api/resolve'
import {type PickerImage} from '#/lib/media/picker.shared'
import {createThreadStore} from '#/components/ComposerV2/store'
import {
  type PostMediaImage,
  type PostMediaImageInput,
  type ThreadStoreInitialState,
} from '#/components/ComposerV2/store/types'
import {
  type ImageUploadDependencies,
  type UploadWorkerOverrides,
} from '#/components/ComposerV2/store/uploads'
import {
  flush,
  manualUploadWorkers,
  realUploadWorkers,
  testUploadRuntime,
} from './uploadTestUtils'

const resolvers = {} as LinkResolvers

const blob = (name: string) => ({$type: 'blob', name}) as unknown as BlobRef

const original = {
  uri: 'file:///original.jpg',
  width: 400,
  height: 300,
  mimeType: 'image/jpeg',
  fileSize: 9000,
}
const crop = {uri: 'file:///crop-1.jpg', width: 200, height: 150}
const secondCrop = {uri: 'file:///crop-2.jpg', width: 100, height: 100}

function makeStore(
  workers: UploadWorkerOverrides,
  initialState?: ThreadStoreInitialState,
) {
  let i = 0
  return createThreadStore({
    defaultLanguages: [],
    ...testUploadRuntime,
    resolvers,
    initialState,
    __createId: () => `id-${++i}`,
    __uploadWorkers: workers,
  })
}

type Store = ReturnType<typeof makeStore>

function rootId(store: Store) {
  return Object.keys(store.getState().posts)[0]
}

function images(store: Store): PostMediaImage[] {
  const media = store.getState().posts[rootId(store)].attachments.media
  if (media?.state !== 'resolved' || media.kind !== 'images') return []
  return media.items
}

/** Adds `count` images; the first is `original`, the rest get other URIs. */
function addImages(store: Store, count = 1) {
  return store.actions.addMedia(
    rootId(store),
    Array.from({length: count}, (_, n) => ({
      kind: 'image' as const,
      ...original,
      uri: n === 0 ? original.uri : `file:///other-${n}.jpg`,
    })),
  )!.addedMediaIds
}

function compressionOutput(width: number, height: number) {
  return {
    width,
    height,
    mimeType: 'image/jpeg',
    aspectRatio: {width, height},
  }
}

describe('replaceImageSource', () => {
  test('the first replace keeps the previous source as original and overwrites every current-source field', () => {
    const {attempts, workers} = manualUploadWorkers()
    const store = makeStore(workers)
    const root = rootId(store)
    const [first, second, third] = addImages(store, 3)
    store.actions.updateMediaAltText(root, second, 'a second look')

    const result = store.actions.replaceImageSource(root, second, crop)

    expect(result).toEqual({supersededUri: undefined})
    expect(images(store).map(item => item.id)).toEqual([first, second, third])
    const edited = images(store)[1]
    expect(edited).toMatchObject({
      uri: crop.uri,
      width: 200,
      height: 150,
      altText: 'a second look',
      original: {...original, uri: 'file:///other-1.jpg'},
      upload: {state: 'pending'},
    })
    /* Values the new source does not supply are unknown again, not inherited. */
    expect(edited.mimeType).toBeUndefined()
    expect(edited.fileSize).toBeUndefined()
    expect(images(store)[0].original).toBeUndefined()
    expect(images(store)[2].original).toBeUndefined()
    expect(attempts).toHaveLength(4)
    store.destroy()
  })

  test('marks a clean composition dirty', () => {
    const {workers} = manualUploadWorkers()
    const store = makeStore(workers, {
      posts: [
        {
          attachments: {
            media: {kind: 'images', items: [{uri: original.uri}]},
          },
        },
      ],
    })
    expect(store.getState().isDirty).toBe(false)

    store.actions.replaceImageSource(rootId(store), images(store)[0].id, crop)

    expect(store.getState().isDirty).toBe(true)
    store.destroy()
  })

  test('a repeated replace keeps the first original and returns the superseded edit', () => {
    const {workers} = manualUploadWorkers()
    const store = makeStore(workers)
    const root = rootId(store)
    const [id] = addImages(store)

    store.actions.replaceImageSource(root, id, crop)
    const result = store.actions.replaceImageSource(root, id, secondCrop)

    expect(result).toEqual({supersededUri: crop.uri})
    expect(images(store)[0]).toMatchObject({
      uri: secondCrop.uri,
      width: 100,
      original,
    })
    store.destroy()
  })

  test('reset restores the original, drops it, and returns the discarded edit', () => {
    const {attempts, workers} = manualUploadWorkers()
    const store = makeStore(workers)
    const root = rootId(store)
    const [id] = addImages(store)
    store.actions.replaceImageSource(root, id, crop)

    const result = store.actions.replaceImageSource(root, id, undefined)

    expect(result).toEqual({supersededUri: crop.uri})
    const item = images(store)[0]
    expect(item).toMatchObject({...original, upload: {state: 'pending'}})
    expect(item.original).toBeUndefined()
    /* The add, the edit, and the reset each started an attempt on their source. */
    expect(attempts.map(attempt => attempt.media)).toEqual([
      expect.objectContaining({uri: original.uri}),
      expect.objectContaining({uri: crop.uri}),
      expect.objectContaining({uri: original.uri}),
    ])
    store.destroy()
  })

  test('handing back the original URI is a reset, so the original is never offered for cleanup', () => {
    const {workers} = manualUploadWorkers()
    const store = makeStore(workers)
    const root = rootId(store)
    const [id] = addImages(store)
    store.actions.replaceImageSource(root, id, crop)

    const result = store.actions.replaceImageSource(root, id, {
      uri: original.uri,
    })

    expect(result).toEqual({supersededUri: crop.uri})
    expect(images(store)[0]).toMatchObject(original)
    expect(images(store)[0].original).toBeUndefined()
    store.destroy()
  })

  test('replacing with the current URI and resetting an unedited item change nothing', () => {
    const {attempts, workers} = manualUploadWorkers()
    const store = makeStore(workers)
    const root = rootId(store)
    const [id] = addImages(store)
    const before = store.getState()

    expect(store.actions.replaceImageSource(root, id, undefined)).toEqual({})
    expect(
      store.actions.replaceImageSource(root, id, {uri: original.uri}),
    ).toEqual({})
    expect(store.getState()).toBe(before)

    store.actions.replaceImageSource(root, id, crop)
    const edited = store.getState()
    expect(store.actions.replaceImageSource(root, id, crop)).toEqual({})
    expect(store.getState()).toBe(edited)
    expect(attempts).toHaveLength(2)
    store.destroy()
  })

  test('editing during compression cancels the old attempt and drops its late results', () => {
    const {attempts, workers} = manualUploadWorkers()
    const store = makeStore(workers)
    const root = rootId(store)
    const [id] = addImages(store)
    const [old] = attempts
    old.report({state: 'uploading', phase: 'compressing'})

    store.actions.replaceImageSource(root, id, crop)

    expect(old.cancel).toHaveBeenCalledTimes(1)
    expect(attempts).toHaveLength(2)
    const afterEdit = store.getState()
    old.attempt.setCompressionResult({prepared: compressionOutput(400, 300)})
    old.attempt.setSourceMetadata({
      metadata: {
        width: 1,
        height: 1,
        mimeType: 'image/png',
      },
    })
    old.report({state: 'uploaded', blob: blob('old')})
    expect(store.getState()).toBe(afterEdit)

    const fresh = attempts[1]
    fresh.attempt.setCompressionResult({prepared: compressionOutput(190, 140)})
    fresh.report({state: 'uploaded', blob: blob('fresh')})
    expect(images(store)[0]).toMatchObject({
      uri: crop.uri,
      prepared: {width: 190},
      upload: {state: 'uploaded', blob: blob('fresh')},
    })
    store.destroy()
  })

  test('editing after upload drops the prepared output and uploaded blob', () => {
    const {attempts, workers} = manualUploadWorkers()
    const store = makeStore(workers)
    const root = rootId(store)
    const [id] = addImages(store)
    attempts[0].attempt.setCompressionResult({
      prepared: compressionOutput(400, 300),
    })
    attempts[0].report({state: 'uploaded', blob: blob('before')})
    expect(images(store)[0]).toMatchObject({upload: {state: 'uploaded'}})

    store.actions.replaceImageSource(root, id, crop)

    const item = images(store)[0]
    expect(item.upload).toEqual({state: 'pending'})
    expect(item.prepared).toBeUndefined()
    expect(attempts).toHaveLength(2)
    store.destroy()
  })

  test('editing after a failure restarts and leaves a retry of the old failure inert', () => {
    const {attempts, workers} = manualUploadWorkers()
    const store = makeStore(workers)
    const root = rootId(store)
    const [id] = addImages(store)
    attempts[0].report({state: 'failed', code: 'network', retryable: true})
    const failed = images(store)[0].upload
    if (failed.state !== 'failed' || !failed.retryable) {
      throw new Error('expected a retryable failure')
    }

    store.actions.replaceImageSource(root, id, crop)
    expect(attempts).toHaveLength(2)
    store.actions.retryMediaUpload(root, id)

    expect(attempts).toHaveLength(2)
    expect(images(store)[0].upload).toEqual({state: 'pending'})
    store.destroy()
  })

  test('alt text survives an edit, and alt edits after it are kept', () => {
    const {workers} = manualUploadWorkers()
    const store = makeStore(workers)
    const root = rootId(store)
    const [id] = addImages(store)
    store.actions.updateMediaAltText(root, id, 'before')

    store.actions.replaceImageSource(root, id, crop)
    expect(images(store)[0].altText).toBe('before')

    store.actions.updateMediaAltText(root, id, 'after')
    store.actions.replaceImageSource(root, id, secondCrop)
    expect(images(store)[0].altText).toBe('after')
    store.destroy()
  })

  test('leaves localRefPath untouched', () => {
    const {workers} = manualUploadWorkers()
    const restored: PostMediaImageInput = {
      uri: original.uri,
      localRefPath: 'image:abc',
    }
    const store = makeStore(workers, {
      posts: [{attachments: {media: {kind: 'images', items: [restored]}}}],
    })

    store.actions.replaceImageSource(rootId(store), images(store)[0].id, crop)

    expect(images(store)[0].localRefPath).toBe('image:abc')
    store.destroy()
  })

  test('is undefined for a missing, removed, or non-image item and after destroy', () => {
    const {attempts, workers} = manualUploadWorkers()
    const store = makeStore(workers)
    const root = rootId(store)
    const [id, removed] = addImages(store, 2)
    store.actions.removeMedia(root, removed)

    expect(store.actions.replaceImageSource('nope', id, crop)).toBeUndefined()
    expect(store.actions.replaceImageSource(root, 'nope', crop)).toBeUndefined()
    expect(
      store.actions.replaceImageSource(root, removed, crop),
    ).toBeUndefined()
    expect(attempts).toHaveLength(2)

    store.actions.removeMediaAttachment(root)
    store.actions.addMedia(root, [
      {kind: 'video', uri: 'file:///v.mp4', mimeType: 'video/mp4'},
    ])
    const media = store.getState().posts[root].attachments.media
    if (media?.state !== 'resolved' || media.kind !== 'video') {
      throw new Error('expected a video')
    }
    const before = store.getState()
    expect(
      store.actions.replaceImageSource(root, media.item.id, crop),
    ).toBeUndefined()
    expect(store.getState()).toBe(before)

    store.destroy()
    expect(store.actions.replaceImageSource(root, id, crop)).toBeUndefined()
  })

  test('removing or destroying after an edit cancels the new attempt and drops its late results', () => {
    const {attempts, workers} = manualUploadWorkers()
    const store = makeStore(workers)
    const root = rootId(store)
    const [id] = addImages(store)
    store.actions.replaceImageSource(root, id, crop)
    const edited = attempts[1]

    store.actions.removeMedia(root, id)
    expect(edited.cancel).toHaveBeenCalledTimes(1)
    const removed = store.getState()
    edited.report({state: 'uploaded', blob: blob('late')})
    expect(store.getState()).toBe(removed)
    expect(images(store)).toEqual([])

    const [again] = addImages(store)
    store.actions.replaceImageSource(root, again, crop)
    const last = attempts[3]
    store.destroy()
    expect(last.cancel).toHaveBeenCalledTimes(1)
  })
})

describe('replaceImageSource with the real image worker', () => {
  const compressed = (path: string): PickerImage => ({
    path,
    width: 10,
    height: 10,
    mime: 'image/jpeg',
    size: 1,
  })

  function realWorkerStore() {
    const getImageDimensions = jest.fn<
      ImageUploadDependencies['getImageDimensions']
    >(() => Promise.resolve({width: 321, height: 123}))
    const compressImage = jest.fn<ImageUploadDependencies['compressImage']>(
      () => Promise.resolve(compressed('file:///out.jpg')),
    )
    const uploadBlob = jest.fn<ImageUploadDependencies['uploadBlob']>(() =>
      Promise.resolve({blob: blob('up')}),
    )
    const store = makeStore(
      realUploadWorkers({
        image: {getImageDimensions, compressImage, uploadBlob},
      }),
    )
    return {store, getImageDimensions, compressImage, uploadBlob}
  }

  test('compresses and uploads the replaced source, not the original', async () => {
    const {store, compressImage, uploadBlob} = realWorkerStore()
    const root = rootId(store)
    const [id] = addImages(store)
    store.actions.replaceImageSource(root, id, crop)
    await flush()

    /* The superseded attempt was cancelled before it compressed anything. */
    expect(compressImage).toHaveBeenCalledTimes(1)
    expect(compressImage.mock.calls[0][0].image.source).toMatchObject({
      path: crop.uri,
      width: 200,
      height: 150,
    })
    expect(uploadBlob).toHaveBeenCalledTimes(1)
    expect(uploadBlob.mock.calls[0][1]).toBe('file:///out.jpg')
    expect(images(store)[0]).toMatchObject({
      uri: crop.uri,
      original,
      prepared: {width: 10},
      upload: {state: 'uploaded'},
    })
    store.destroy()
  })

  test('probes a replaced source with unknown dimensions without touching the original', async () => {
    const {store, getImageDimensions, compressImage} = realWorkerStore()
    const root = rootId(store)
    const [id] = addImages(store)
    await flush()
    expect(getImageDimensions).not.toHaveBeenCalled()

    store.actions.replaceImageSource(root, id, {uri: crop.uri})
    await flush()

    expect(getImageDimensions).toHaveBeenCalledWith(crop.uri)
    expect(images(store)[0]).toMatchObject({
      uri: crop.uri,
      width: 321,
      height: 123,
      original,
    })
    expect(compressImage.mock.calls.at(-1)?.[0].image.source).toMatchObject({
      path: crop.uri,
      width: 321,
      height: 123,
    })
    store.destroy()
  })
})

describe('source metadata', () => {
  test('valid worker metadata fills a known-but-invalid size', () => {
    const {attempts, workers} = manualUploadWorkers()
    const store = makeStore(workers)
    const root = rootId(store)
    store.actions.addMedia(root, [
      {kind: 'image', uri: original.uri, width: -1, height: 300},
    ])

    attempts[0].attempt.setSourceMetadata({metadata: {width: 640, height: 480}})

    expect(images(store)[0]).toMatchObject({width: 640, height: 480})
    store.destroy()
  })
})
