import {beforeEach, describe, expect, jest, test} from '@jest/globals'
import {type AtpAgent} from '@atproto/api'

import {createThreadStore} from '#/components/ComposerV2/store'
import {type PostEmbedMedia} from '#/components/ComposerV2/store/types'

function makeIdGenerator() {
  let i = 0
  return () => `id-${++i}`
}

const agent = {} as AtpAgent

function rootId(store: ReturnType<typeof createThreadStore>) {
  return Object.keys(store.getState().posts)[0]
}

function getMedia(
  store: ReturnType<typeof createThreadStore>,
  postId: string,
): PostEmbedMedia[] {
  return store.getState().posts[postId].media
}

const sampleImage = () => ({
  uri: 'file:///tmp/a.jpg',
  width: 100,
  height: 100,
})

beforeEach(() => {
  jest.useFakeTimers()
})

describe('queueImageUpload', () => {
  test('appends an image with pending upload status and returns its id', () => {
    const store = createThreadStore({agent, __createId: makeIdGenerator()})
    const root = rootId(store)
    const imageId = store.actions.queueImageUpload(root, sampleImage())
    expect(imageId).toBe('id-2')

    const media = getMedia(store, root)
    expect(media).toHaveLength(1)
    expect(media[0].kind).toBe('image')
    expect(media[0].id).toBe('id-2')
    expect(media[0].kind === 'image' && media[0].upload).toEqual({
      state: 'pending',
    })
  })

  test('marks state dirty', () => {
    const store = createThreadStore({agent, __createId: makeIdGenerator()})
    expect(store.getState().isDirty).toBe(false)
    store.actions.queueImageUpload(rootId(store), sampleImage())
    expect(store.getState().isDirty).toBe(true)
  })

  test('attaches the post id to the new media item', () => {
    const store = createThreadStore({agent, __createId: makeIdGenerator()})
    const root = rootId(store)
    const imageId = store.actions.queueImageUpload(root, sampleImage())!
    const media = getMedia(store, root).find(m => m.id === imageId)!
    expect(media.postId).toBe(root)
  })

  test('returns undefined and is a no-op when post id is unknown', () => {
    const store = createThreadStore({agent, __createId: makeIdGenerator()})
    const before = store.getState()
    const result = store.actions.queueImageUpload('does-not-exist', sampleImage())
    expect(result).toBeUndefined()
    expect(store.getState()).toBe(before)
  })

  test('drives upload from pending -> uploading -> uploaded', () => {
    const store = createThreadStore({agent, __createId: makeIdGenerator()})
    const root = rootId(store)
    const imageId = store.actions.queueImageUpload(root, sampleImage())!

    const get = () => {
      const m = getMedia(store, root).find(x => x.id === imageId)!
      if (m.kind !== 'image') throw new Error('expected image')
      return m.upload
    }

    expect(get().state).toBe('pending')
    jest.advanceTimersByTime(100)
    expect(get().state).toBe('uploading')
    jest.runAllTimers()
    expect(get().state).toBe('uploaded')
  })

  test('multiple queued images coexist on the same post', () => {
    const store = createThreadStore({agent, __createId: makeIdGenerator()})
    const root = rootId(store)
    store.actions.queueImageUpload(root, sampleImage())
    store.actions.queueImageUpload(root, sampleImage())
    expect(getMedia(store, root)).toHaveLength(2)
  })
})

describe('removeImage', () => {
  test('removes the image from media and leaves other media intact', () => {
    const store = createThreadStore({agent, __createId: makeIdGenerator()})
    const root = rootId(store)
    const a = store.actions.queueImageUpload(root, sampleImage())!
    const b = store.actions.queueImageUpload(root, sampleImage())!

    store.actions.removeImage(root, a)
    const media = getMedia(store, root)
    expect(media.map(m => m.id)).toEqual([b])
  })

  test('cancels in-flight upload (no further status writes after removal)', () => {
    const store = createThreadStore({agent, __createId: makeIdGenerator()})
    const root = rootId(store)
    const imageId = store.actions.queueImageUpload(root, sampleImage())!
    // Let one tick of progress happen, then remove.
    jest.advanceTimersByTime(100)
    store.actions.removeImage(root, imageId)
    // Drain the rest of the simulated upload; no media should reappear.
    expect(() => jest.runAllTimers()).not.toThrow()
    expect(getMedia(store, root)).toHaveLength(0)
  })

  test('is a no-op when image id is unknown', () => {
    const store = createThreadStore({agent, __createId: makeIdGenerator()})
    const root = rootId(store)
    store.actions.queueImageUpload(root, sampleImage())
    const before = store.getState()
    store.actions.removeImage(root, 'does-not-exist')
    expect(store.getState()).toBe(before)
  })
})

describe('retryImageUpload', () => {
  test('resets a failed upload back to pending and walks it through to uploaded', () => {
    const store = createThreadStore({agent, __createId: makeIdGenerator()})
    const root = rootId(store)
    const imageId = store.actions.queueImageUpload(root, sampleImage())!
    // Simulate a failure by overriding status directly.
    store.actions.setUploadStatus(root, imageId, {
      state: 'failed',
      error: 'boom',
    })

    const get = () => {
      const m = getMedia(store, root).find(x => x.id === imageId)!
      if (m.kind !== 'image') throw new Error('expected image')
      return m.upload
    }
    expect(get().state).toBe('failed')

    store.actions.retryImageUpload(root, imageId)
    expect(get().state).toBe('pending')
    jest.runAllTimers()
    expect(get().state).toBe('uploaded')
  })

  test('failed status carries a bound retry() method that restarts the upload', () => {
    const store = createThreadStore({agent, __createId: makeIdGenerator()})
    const root = rootId(store)
    const imageId = store.actions.queueImageUpload(root, sampleImage())!
    store.actions.setUploadStatus(root, imageId, {
      state: 'failed',
      error: 'network',
    })

    const get = () => {
      const m = getMedia(store, root).find(x => x.id === imageId)!
      if (m.kind !== 'image') throw new Error('expected image')
      return m.upload
    }
    const failed = get()
    if (failed.state !== 'failed') throw new Error('expected failed')
    expect(typeof failed.retry).toBe('function')

    failed.retry()
    expect(get().state).toBe('pending')
    jest.runAllTimers()
    expect(get().state).toBe('uploaded')
  })

  test('cancels an existing in-flight task before starting a new one', () => {
    const store = createThreadStore({agent, __createId: makeIdGenerator()})
    const root = rootId(store)
    const imageId = store.actions.queueImageUpload(root, sampleImage())!
    // Partially advance the original task.
    jest.advanceTimersByTime(100)

    store.actions.retryImageUpload(root, imageId)
    const get = () => {
      const m = getMedia(store, root).find(x => x.id === imageId)!
      if (m.kind !== 'image') throw new Error('expected image')
      return m.upload
    }
    expect(get().state).toBe('pending')
    jest.runAllTimers()
    expect(get().state).toBe('uploaded')
  })

  test('is a no-op when post or image id is unknown', () => {
    const store = createThreadStore({agent, __createId: makeIdGenerator()})
    const root = rootId(store)
    store.actions.queueImageUpload(root, sampleImage())
    const before = store.getState()
    store.actions.retryImageUpload(root, 'does-not-exist')
    expect(store.getState()).toBe(before)
    store.actions.retryImageUpload('nope', 'whatever')
    expect(store.getState()).toBe(before)
  })
})

describe('setImageAltText', () => {
  test('updates only the matching image', () => {
    const store = createThreadStore({agent, __createId: makeIdGenerator()})
    const root = rootId(store)
    const a = store.actions.queueImageUpload(root, sampleImage())!
    const b = store.actions.queueImageUpload(root, sampleImage())!
    store.actions.setImageAltText(root, b, 'a description')

    const media = getMedia(store, root)
    expect(media.find(m => m.id === a)?.kind === 'image' && media.find(m => m.id === a)).toMatchObject({altText: ''})
    expect(media.find(m => m.id === b)?.kind === 'image' && media.find(m => m.id === b)).toMatchObject({altText: 'a description'})
  })
})

describe('removePost cancels media uploads', () => {
  test('removing a post cancels any in-flight uploads on that post', () => {
    const store = createThreadStore({agent, __createId: makeIdGenerator()})
    const a = rootId(store)
    const b = store.actions.addPost('after', a)
    store.actions.queueImageUpload(b, sampleImage())
    jest.advanceTimersByTime(100)

    store.actions.removePost(b)
    // Draining timers should not crash and the removed post stays gone.
    expect(() => jest.runAllTimers()).not.toThrow()
    expect(Object.keys(store.getState().posts)).toEqual([a])
  })
})

describe('destroy cancels uploads', () => {
  test('destroy stops any in-flight uploads', () => {
    const store = createThreadStore({agent, __createId: makeIdGenerator()})
    const root = rootId(store)
    store.actions.queueImageUpload(root, sampleImage())
    jest.advanceTimersByTime(100)
    store.destroy()
    expect(() => jest.runAllTimers()).not.toThrow()
  })
})
