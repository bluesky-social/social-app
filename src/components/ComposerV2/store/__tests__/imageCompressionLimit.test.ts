import {describe, expect, jest, test} from '@jest/globals'

/* Avoid loading the UI module chain through the real link resolver. */
jest.mock('#/lib/api/resolve', () => ({resolveLink: jest.fn()}))

import {type BlobRef} from '@atproto/lex'

import {type LinkResolvers} from '#/lib/api/resolve'
import {type PickerImage} from '#/lib/media/picker.shared'
import {createThreadStore} from '#/components/ComposerV2/store'
import {
  type PostMediaImage,
  type ThreadStoreInitialState,
} from '#/components/ComposerV2/store/types'
import {type ImageUploadDependencies} from '#/components/ComposerV2/store/uploads'
import {createConcurrencyLimit} from '#/components/ComposerV2/store/utils/createConcurrencyLimit'
import {getMediaItems} from '#/components/ComposerV2/store/utils/getMediaItems'
import {realUploadWorkers, testUploadRuntime} from './uploadTestUtils'

const resolvers = {} as LinkResolvers

function deferred<T = void>() {
  let resolve!: (value: T) => void
  let reject!: (cause: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return {promise, resolve, reject}
}

async function settle() {
  for (let i = 0; i < 20; i++) await Promise.resolve()
}

const blob = (name: string) => ({$type: 'blob', name}) as unknown as BlobRef

const known = {width: 400, height: 300}

function compressed(path: string): PickerImage {
  return {path, mime: 'image/jpeg', width: 200, height: 100, size: 10}
}

/**
 * Fake image dependencies whose every step is settled by hand. `inFlight`
 * counts dimension reads and compressions that have started but not settled,
 * and `peak` is the most that ever overlapped.
 */
function createImageFakes() {
  let inFlight = 0
  let peak = 0
  const begin = () => {
    peak = Math.max(peak, ++inFlight)
  }
  const dimensionReads: Array<{
    uri: string
    gate: ReturnType<typeof deferred<{width: number; height: number}>>
  }> = []
  const compressions: Array<{
    uri: string
    gate: ReturnType<typeof deferred<PickerImage>>
  }> = []
  const uploads: Array<{
    path: string
    gate: ReturnType<typeof deferred<{blob: BlobRef}>>
  }> = []
  const getImageDimensions = jest.fn(async (uri: string) => {
    const gate = deferred<{width: number; height: number}>()
    dimensionReads.push({uri, gate})
    begin()
    try {
      return await gate.promise
    } finally {
      inFlight--
    }
  })
  const compressImage = jest.fn(
    async ({image}: {image: {source: {path: string}}}) => {
      const gate = deferred<PickerImage>()
      compressions.push({uri: image.source.path, gate})
      begin()
      try {
        return await gate.promise
      } finally {
        inFlight--
      }
    },
  )
  const uploadBlob = jest.fn(async (_client: unknown, path: string) => {
    const gate = deferred<{blob: BlobRef}>()
    uploads.push({path, gate})
    return gate.promise
  })
  return {
    dependencies: {getImageDimensions, compressImage, uploadBlob} as Pick<
      ImageUploadDependencies,
      'getImageDimensions' | 'compressImage' | 'uploadBlob'
    >,
    dimensionReads,
    compressions,
    uploads,
    peak: () => peak,
    compressedUris: () => compressions.map(c => c.uri),
  }
}

function makeStore({
  fakes,
  limit,
  initialState,
}: {
  fakes: ReturnType<typeof createImageFakes>
  limit: ReturnType<typeof createConcurrencyLimit>
  initialState?: ThreadStoreInitialState
}) {
  let i = 0
  const store = createThreadStore({
    ...testUploadRuntime,
    resolvers,
    initialState,
    __createId: () => `id-${++i}`,
    __uploadWorkers: realUploadWorkers({
      image: {...fakes.dependencies, limitImageCompression: limit},
    }),
  })
  /* Every upload status the store ever published, to prove nothing failed. */
  const states: string[] = []
  store.subscribe(() => {
    for (const post of Object.values(store.getState().posts)) {
      for (const item of getMediaItems({media: post.attachments.media})) {
        if (item.kind !== 'gif') states.push(item.upload.state)
      }
    }
  })
  return {store, states}
}

type Store = ReturnType<typeof makeStore>['store']

function postIds(store: Store) {
  return Object.keys(store.getState().posts)
}

function imagesOf(store: Store, postId: string): PostMediaImage[] {
  const media = store.getState().posts[postId].attachments.media
  if (media?.state !== 'resolved' || media.kind !== 'images') return []
  return media.items
}

function allImages(store: Store) {
  return postIds(store).flatMap(id => imagesOf(store, id))
}

function imageInitial(uri: string) {
  return {uri, ...known, mimeType: 'image/jpeg'}
}

function addImage(store: Store, postId: string, uri: string) {
  return store.actions.addMedia(postId, [
    {kind: 'image', ...imageInitial(uri)},
  ])!.addedMediaIds[0]
}

describe('image compression limit', () => {
  test('images across posts and initial state compress one at a time', async () => {
    const fakes = createImageFakes()
    const {store, states} = makeStore({
      fakes,
      limit: createConcurrencyLimit({max: 1}),
      initialState: {
        posts: [
          {
            attachments: {
              media: {
                kind: 'images',
                items: [
                  imageInitial('file:///a.jpg'),
                  imageInitial('file:///b.jpg'),
                ],
              },
            },
          },
          {
            attachments: {
              media: {kind: 'images', items: [imageInitial('file:///c.jpg')]},
            },
          },
        ],
      },
    })
    const [, second] = postIds(store)
    addImage(store, second, 'file:///d.jpg')
    await settle()
    expect(fakes.compressedUris()).toEqual(['file:///a.jpg'])

    for (const uri of ['a', 'b', 'c', 'd']) {
      const next = fakes.compressions.find(c => c.uri === `file:///${uri}.jpg`)
      if (!next) throw new Error(`expected ${uri} to have started`)
      next.gate.resolve(compressed(`file:///${uri}-out.jpg`))
      await settle()
    }

    expect(fakes.compressedUris()).toEqual([
      'file:///a.jpg',
      'file:///b.jpg',
      'file:///c.jpg',
      'file:///d.jpg',
    ])
    expect(fakes.peak()).toBe(1)
    expect(states).not.toContain('failed')
    store.destroy()
  })

  test('a slow upload does not block the next compression', async () => {
    const fakes = createImageFakes()
    const {store} = makeStore({fakes, limit: createConcurrencyLimit({max: 1})})
    const [root] = postIds(store)
    addImage(store, root, 'file:///a.jpg')
    addImage(store, root, 'file:///b.jpg')
    await settle()

    fakes.compressions[0].gate.resolve(compressed('file:///a-out.jpg'))
    await settle()

    expect(fakes.uploads.map(u => u.path)).toEqual(['file:///a-out.jpg'])
    expect(fakes.compressedUris()).toEqual(['file:///a.jpg', 'file:///b.jpg'])
    store.destroy()
  })

  test('attachment order follows the items, not completion order', async () => {
    const fakes = createImageFakes()
    const {store} = makeStore({fakes, limit: createConcurrencyLimit({max: 1})})
    const [root] = postIds(store)
    addImage(store, root, 'file:///a.jpg')
    addImage(store, root, 'file:///b.jpg')
    await settle()
    fakes.compressions[0].gate.resolve(compressed('file:///a-out.jpg'))
    await settle()
    fakes.compressions[1].gate.resolve(compressed('file:///b-out.jpg'))
    await settle()

    /* b finishes uploading first. */
    fakes.uploads[1].gate.resolve({blob: blob('b')})
    await settle()
    fakes.uploads[0].gate.resolve({blob: blob('a')})
    await settle()

    expect(
      imagesOf(store, root).map(i => [i.uri, i.upload.state === 'uploaded']),
    ).toEqual([
      ['file:///a.jpg', true],
      ['file:///b.jpg', true],
    ])
    store.destroy()
  })

  test('an item without dimensions reads them inside the guarded phase', async () => {
    const fakes = createImageFakes()
    const {store} = makeStore({fakes, limit: createConcurrencyLimit({max: 1})})
    const [root] = postIds(store)
    store.actions.addMedia(root, [
      {kind: 'image', uri: 'file:///pasted-1.jpg'},
      {kind: 'image', uri: 'file:///pasted-2.jpg'},
    ])
    await settle()
    expect(fakes.dimensionReads.map(r => r.uri)).toEqual([
      'file:///pasted-1.jpg',
    ])

    fakes.dimensionReads[0].gate.resolve(known)
    await settle()
    expect(fakes.dimensionReads).toHaveLength(1)
    expect(fakes.compressedUris()).toEqual(['file:///pasted-1.jpg'])

    fakes.compressions[0].gate.resolve(compressed('file:///one-out.jpg'))
    await settle()
    expect(fakes.dimensionReads.map(r => r.uri)).toEqual([
      'file:///pasted-1.jpg',
      'file:///pasted-2.jpg',
    ])
    expect(fakes.peak()).toBe(1)
    store.destroy()
  })

  describe('cancellation', () => {
    test('removing a queued image never calls its compressor', async () => {
      const fakes = createImageFakes()
      const {store, states} = makeStore({
        fakes,
        limit: createConcurrencyLimit({max: 1}),
      })
      const [root] = postIds(store)
      addImage(store, root, 'file:///a.jpg')
      const queued = addImage(store, root, 'file:///b.jpg')
      addImage(store, root, 'file:///c.jpg')
      await settle()

      store.actions.removeMedia(root, queued)
      fakes.compressions[0].gate.resolve(compressed('file:///a-out.jpg'))
      await settle()

      expect(fakes.compressedUris()).toEqual(['file:///a.jpg', 'file:///c.jpg'])
      expect(states).not.toContain('failed')
      store.destroy()
    })

    test('removing an in-flight image holds the slot until it settles and ignores its result', async () => {
      const fakes = createImageFakes()
      const {store, states} = makeStore({
        fakes,
        limit: createConcurrencyLimit({max: 1}),
      })
      const [root] = postIds(store)
      const running = addImage(store, root, 'file:///a.jpg')
      addImage(store, root, 'file:///b.jpg')
      await settle()

      store.actions.removeMedia(root, running)
      await settle()
      expect(fakes.compressedUris()).toEqual(['file:///a.jpg'])

      fakes.compressions[0].gate.resolve(compressed('file:///a-out.jpg'))
      await settle()

      expect(fakes.compressedUris()).toEqual(['file:///a.jpg', 'file:///b.jpg'])
      expect(fakes.uploads).toHaveLength(0)
      expect(imagesOf(store, root).map(i => i.uri)).toEqual(['file:///b.jpg'])
      expect(states).not.toContain('failed')
      store.destroy()
    })

    test('overlapping stores share the cap while a destroyed store finishes', async () => {
      const fakes = createImageFakes()
      const limit = createConcurrencyLimit({max: 1})
      const first = makeStore({fakes, limit})
      const second = makeStore({fakes, limit})
      addImage(first.store, postIds(first.store)[0], 'file:///a.jpg')
      addImage(second.store, postIds(second.store)[0], 'file:///b.jpg')
      await settle()
      expect(fakes.compressedUris()).toEqual(['file:///a.jpg'])

      first.store.destroy()
      await settle()
      expect(fakes.compressedUris()).toEqual(['file:///a.jpg'])

      fakes.compressions[0].gate.resolve(compressed('file:///a-out.jpg'))
      await settle()

      expect(fakes.compressedUris()).toEqual(['file:///a.jpg', 'file:///b.jpg'])
      expect(fakes.uploads).toHaveLength(0)
      expect(allImages(first.store).map(i => i.prepared)).toEqual([undefined])
      expect(fakes.peak()).toBe(1)
      second.store.destroy()
    })
  })

  describe('replaceImageSource', () => {
    const crop = {uri: 'file:///crop.jpg', ...known}

    test('replacing an in-flight image queues the new attempt behind the old compression', async () => {
      const fakes = createImageFakes()
      const {store, states} = makeStore({
        fakes,
        limit: createConcurrencyLimit({max: 1}),
      })
      const [root] = postIds(store)
      const id = addImage(store, root, 'file:///a.jpg')
      await settle()

      store.actions.replaceImageSource(root, id, crop)
      await settle()
      expect(fakes.compressedUris()).toEqual(['file:///a.jpg'])

      fakes.compressions[0].gate.resolve(compressed('file:///a-out.jpg'))
      await settle()

      expect(fakes.compressedUris()).toEqual(['file:///a.jpg', crop.uri])
      expect(imagesOf(store, root)[0].prepared).toBeUndefined()

      fakes.compressions[1].gate.resolve(compressed('file:///crop-out.jpg'))
      await settle()
      expect(imagesOf(store, root)[0].prepared?.uri).toBe(
        'file:///crop-out.jpg',
      )
      expect(fakes.uploads.map(u => u.path)).toEqual(['file:///crop-out.jpg'])
      expect(states).not.toContain('failed')
      store.destroy()
    })

    test('replacing a queued image never compresses its old source', async () => {
      const fakes = createImageFakes()
      const {store} = makeStore({
        fakes,
        limit: createConcurrencyLimit({max: 1}),
      })
      const [root] = postIds(store)
      addImage(store, root, 'file:///a.jpg')
      const queued = addImage(store, root, 'file:///b.jpg')
      await settle()

      store.actions.replaceImageSource(root, queued, crop)
      fakes.compressions[0].gate.resolve(compressed('file:///a-out.jpg'))
      await settle()

      expect(fakes.compressedUris()).toEqual(['file:///a.jpg', crop.uri])
      store.destroy()
    })
  })

  test('a failed compression frees the slot and its retry goes back through the limiter', async () => {
    const fakes = createImageFakes()
    const {store} = makeStore({fakes, limit: createConcurrencyLimit({max: 1})})
    const [root] = postIds(store)
    const failing = addImage(store, root, 'file:///a.jpg')
    addImage(store, root, 'file:///b.jpg')
    await settle()

    fakes.compressions[0].gate.reject(new Error('boom'))
    await settle()
    expect(fakes.compressedUris()).toEqual(['file:///a.jpg', 'file:///b.jpg'])

    const item = imagesOf(store, root).find(i => i.id === failing)!
    expect(item.upload.state).toBe('failed')
    store.actions.retryMediaUpload(root, failing)
    await settle()
    /* b still holds the slot, so the retry waits for it. */
    expect(fakes.compressedUris()).toHaveLength(2)

    fakes.compressions[1].gate.resolve(compressed('file:///b-out.jpg'))
    await settle()
    expect(fakes.compressedUris()).toEqual([
      'file:///a.jpg',
      'file:///b.jpg',
      'file:///a.jpg',
    ])
    fakes.compressions[2].gate.resolve(compressed('file:///a-out.jpg'))
    await settle()
    expect(fakes.uploads.map(u => u.path)).toEqual([
      'file:///b-out.jpg',
      'file:///a-out.jpg',
    ])
    expect(fakes.peak()).toBe(1)
    store.destroy()
  })
})
