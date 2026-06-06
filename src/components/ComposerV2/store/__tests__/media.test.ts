import {type AtpAgent} from '@atproto/api'
import {beforeEach, describe, expect, jest, test} from '@jest/globals'

// Avoid pulling the UI module chain (gallery → media picker → ALF) into the
// test environment via the resolveLink import in linkResolution.ts.
jest.mock('#/lib/api/resolve', () => ({
  resolveLink: jest.fn(),
}))
jest.mock('#/state/session/agent', () => ({
  createPublicAgent: jest.fn(() => ({})),
}))

import {type resolveLink} from '#/lib/api/resolve'
import {createThreadStore} from '#/components/ComposerV2/store'
import {
  type AddMediaInput,
  type PostEmbedMedia,
} from '#/components/ComposerV2/store/types'
import {type Gif} from '#/features/gifPicker/types'

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

const imageInput: AddMediaInput = {
  kind: 'image',
  uri: 'file:///tmp/a.jpg',
  width: 100,
  height: 100,
}

const videoInput: AddMediaInput = {
  kind: 'video',
  uri: 'file:///tmp/a.mp4',
  width: 1920,
  height: 1080,
  mimeType: 'video/mp4',
}

const gifInput: AddMediaInput = {
  kind: 'gif',
  // Tests don't read inside the gif, so a minimal cast is fine.
  gif: {url: 'https://example.com/g.gif'} as Gif,
}

// Embed-routing tests live in embeds.test.ts; here we just need a never-
// resolving resolveLink so any addUri-driven resolution doesn't crash and
// no result ever lands. The promise never settles, which is what we want.
let mockResolveLink: jest.Mock<typeof resolveLink>

beforeEach(() => {
  jest.useFakeTimers()
  mockResolveLink = jest.fn(
    () => new Promise(() => {}),
  ) as unknown as jest.Mock<typeof resolveLink>
})

function makeStore() {
  return createThreadStore({
    agent,
    __createId: makeIdGenerator(),
    __resolveLink: mockResolveLink,
  })
}

describe('addMedia', () => {
  test('adds a single image with pending upload status and returns its id', () => {
    const store = makeStore()
    const root = rootId(store)
    const ids = store.actions.addMedia(root, [imageInput])
    expect(ids).toEqual(['id-2'])

    const media = getMedia(store, root)
    expect(media).toHaveLength(1)
    expect(media[0].kind).toBe('image')
    expect(media[0].id).toBe('id-2')
    expect(media[0].postId).toBe(root)
    if (media[0].kind !== 'image') throw new Error('expected image')
    expect(media[0].upload).toEqual({state: 'pending'})
  })

  test('preserves input order in returned ids and on the post', () => {
    const store = makeStore()
    const root = rootId(store)
    const ids = store.actions.addMedia(root, [
      imageInput,
      imageInput,
      imageInput,
    ])
    expect(ids).toHaveLength(3)
    expect(getMedia(store, root).map(m => m.id)).toEqual(ids)
  })

  test('marks state dirty', () => {
    const store = makeStore()
    expect(store.getState().isDirty).toBe(false)
    store.actions.addMedia(rootId(store), [imageInput])
    expect(store.getState().isDirty).toBe(true)
  })

  test('returns undefined and is a no-op when post id is unknown', () => {
    const store = makeStore()
    const before = store.getState()
    const result = store.actions.addMedia('does-not-exist', [imageInput])
    expect(result).toBeUndefined()
    expect(store.getState()).toBe(before)
  })

  test('returns [] for an empty input list and is a no-op', () => {
    const store = makeStore()
    const before = store.getState()
    const result = store.actions.addMedia(rootId(store), [])
    expect(result).toEqual([])
    expect(store.getState()).toBe(before)
  })

  test('drives an image upload from pending -> uploading -> uploaded', () => {
    const store = makeStore()
    const root = rootId(store)
    const [imageId] = store.actions.addMedia(root, [imageInput])!

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

  test('drives a video upload through to uploaded', () => {
    const store = makeStore()
    const root = rootId(store)
    const [videoId] = store.actions.addMedia(root, [videoInput])!

    const get = () => {
      const m = getMedia(store, root).find(x => x.id === videoId)!
      if (m.kind !== 'video') throw new Error('expected video')
      return m.upload
    }

    expect(get().state).toBe('pending')
    jest.runAllTimers()
    expect(get().state).toBe('uploaded')
  })

  test('does not start an upload task for a gif', () => {
    const store = makeStore()
    const root = rootId(store)
    store.actions.addMedia(root, [gifInput])
    jest.runAllTimers()
    const media = getMedia(store, root)
    expect(media[0].kind).toBe('gif')
    // Gif media records have no `upload` field.
    expect('upload' in media[0]).toBe(false)
  })
})

describe('addMedia input validation (first item dictates kind, cap by count)', () => {
  test('image-first: filters out non-images and caps at 4', () => {
    const store = makeStore()
    const root = rootId(store)
    const ids = store.actions.addMedia(root, [
      imageInput,
      videoInput,
      imageInput,
      imageInput,
      gifInput,
      imageInput,
      imageInput,
    ])
    expect(ids).toHaveLength(4)
    const media = getMedia(store, root)
    expect(media).toHaveLength(4)
    expect(media.every(m => m.kind === 'image')).toBe(true)
  })

  test('video-first: filters out non-videos and caps at 1', () => {
    const store = makeStore()
    const root = rootId(store)
    const ids = store.actions.addMedia(root, [
      videoInput,
      imageInput,
      videoInput,
    ])
    expect(ids).toHaveLength(1)
    expect(getMedia(store, root)[0].kind).toBe('video')
  })

  test('gif-first: filters out non-gifs and caps at 1', () => {
    const store = makeStore()
    const root = rootId(store)
    const ids = store.actions.addMedia(root, [gifInput, gifInput, imageInput])
    expect(ids).toHaveLength(1)
    expect(getMedia(store, root)[0].kind).toBe('gif')
  })
})

describe('addMedia respects existing media on the post', () => {
  test('appends images up to a total of 4 when the post already has images', () => {
    const store = makeStore()
    const root = rootId(store)
    store.actions.addMedia(root, [imageInput, imageInput])
    const ids = store.actions.addMedia(root, [
      imageInput,
      imageInput,
      imageInput,
    ])
    // Two existing + capacity of 2 more.
    expect(ids).toHaveLength(2)
    expect(getMedia(store, root)).toHaveLength(4)
  })

  test('drops non-image inputs when the post already has images', () => {
    const store = makeStore()
    const root = rootId(store)
    store.actions.addMedia(root, [imageInput])
    const ids = store.actions.addMedia(root, [videoInput, gifInput])
    expect(ids).toEqual([])
    expect(getMedia(store, root)).toHaveLength(1)
  })

  test('is a no-op when the post already has 4 images', () => {
    const store = makeStore()
    const root = rootId(store)
    store.actions.addMedia(root, [
      imageInput,
      imageInput,
      imageInput,
      imageInput,
    ])
    const before = store.getState()
    const ids = store.actions.addMedia(root, [imageInput])
    expect(ids).toEqual([])
    expect(store.getState()).toBe(before)
  })

  test('is a no-op when the post already has a video', () => {
    const store = makeStore()
    const root = rootId(store)
    store.actions.addMedia(root, [videoInput])
    const before = store.getState()
    const ids = store.actions.addMedia(root, [imageInput, gifInput])
    expect(ids).toEqual([])
    expect(store.getState()).toBe(before)
  })

  test('is a no-op when the post already has a gif', () => {
    const store = makeStore()
    const root = rootId(store)
    store.actions.addMedia(root, [gifInput])
    const before = store.getState()
    const ids = store.actions.addMedia(root, [imageInput, videoInput])
    expect(ids).toEqual([])
    expect(store.getState()).toBe(before)
  })

  test('is a no-op when the post has an external link card', () => {
    const store = makeStore()
    const root = rootId(store)
    store.actions.addUri(root, 'https://example.com')
    const before = store.getState()
    const ids = store.actions.addMedia(root, [imageInput])
    expect(ids).toEqual([])
    expect(store.getState()).toBe(before)
  })
})

describe('selectionsRemaining flags on the post', () => {
  test('empty post starts with 4 / 1 / 1', () => {
    const store = makeStore()
    const post = store.getState().posts[rootId(store)]
    expect(post.imageSelectionsRemaining).toBe(4)
    expect(post.videoSelectionsRemaining).toBe(1)
    expect(post.gifSelectionsRemaining).toBe(1)
  })

  test('decrements as images are added', () => {
    const store = makeStore()
    const root = rootId(store)
    store.actions.addMedia(root, [imageInput, imageInput])
    let post = store.getState().posts[root]
    expect(post.imageSelectionsRemaining).toBe(2)
    expect(post.videoSelectionsRemaining).toBe(0)
    expect(post.gifSelectionsRemaining).toBe(0)

    store.actions.addMedia(root, [imageInput, imageInput])
    post = store.getState().posts[root]
    expect(post.imageSelectionsRemaining).toBe(0)
  })

  test('a video locks all three counters to 0', () => {
    const store = makeStore()
    const root = rootId(store)
    store.actions.addMedia(root, [videoInput])
    const post = store.getState().posts[root]
    expect(post.imageSelectionsRemaining).toBe(0)
    expect(post.videoSelectionsRemaining).toBe(0)
    expect(post.gifSelectionsRemaining).toBe(0)
  })

  test('a gif locks all three counters to 0', () => {
    const store = makeStore()
    const root = rootId(store)
    store.actions.addMedia(root, [gifInput])
    const post = store.getState().posts[root]
    expect(post.imageSelectionsRemaining).toBe(0)
    expect(post.videoSelectionsRemaining).toBe(0)
    expect(post.gifSelectionsRemaining).toBe(0)
  })

  test('removing media restores capacity', () => {
    const store = makeStore()
    const root = rootId(store)
    const [imgId] = store.actions.addMedia(root, [imageInput])!
    expect(store.getState().posts[root].imageSelectionsRemaining).toBe(3)
    store.actions.removeMedia(root, imgId)
    const post = store.getState().posts[root]
    expect(post.imageSelectionsRemaining).toBe(4)
    expect(post.videoSelectionsRemaining).toBe(1)
    expect(post.gifSelectionsRemaining).toBe(1)
  })

  test('an external link card locks all three counters to 0', () => {
    const store = makeStore()
    const root = rootId(store)
    store.actions.addUri(root, 'https://example.com')
    const post = store.getState().posts[root]
    expect(post.imageSelectionsRemaining).toBe(0)
    expect(post.videoSelectionsRemaining).toBe(0)
    expect(post.gifSelectionsRemaining).toBe(0)
  })

  test('removing the external link card restores capacity', () => {
    const store = makeStore()
    const root = rootId(store)
    store.actions.addUri(root, 'https://example.com')
    store.actions.removeEmbed(root)
    const post = store.getState().posts[root]
    expect(post.imageSelectionsRemaining).toBe(4)
    expect(post.videoSelectionsRemaining).toBe(1)
    expect(post.gifSelectionsRemaining).toBe(1)
  })
})

describe('removeMedia', () => {
  test('removes the matching media and leaves others intact', () => {
    const store = makeStore()
    const root = rootId(store)
    const [a, b] = store.actions.addMedia(root, [imageInput, imageInput])!

    store.actions.removeMedia(root, a)
    expect(getMedia(store, root).map(m => m.id)).toEqual([b])
  })

  test('cancels in-flight upload (no further status writes after removal)', () => {
    const store = makeStore()
    const root = rootId(store)
    const [imageId] = store.actions.addMedia(root, [imageInput])!
    jest.advanceTimersByTime(100)
    store.actions.removeMedia(root, imageId)
    expect(() => jest.runAllTimers()).not.toThrow()
    expect(getMedia(store, root)).toHaveLength(0)
  })

  test('is a no-op when media id is unknown', () => {
    const store = makeStore()
    const root = rootId(store)
    store.actions.addMedia(root, [imageInput])
    const before = store.getState()
    store.actions.removeMedia(root, 'does-not-exist')
    expect(store.getState()).toBe(before)
  })
})

describe('retryMediaUpload', () => {
  test('resets a failed image upload back to pending and walks it to uploaded', () => {
    const store = makeStore()
    const root = rootId(store)
    const [imageId] = store.actions.addMedia(root, [imageInput])!
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

    store.actions.retryMediaUpload(root, imageId)
    expect(get().state).toBe('pending')
    jest.runAllTimers()
    expect(get().state).toBe('uploaded')
  })

  test('failed status carries a bound retry() method that restarts the upload', () => {
    const store = makeStore()
    const root = rootId(store)
    const [imageId] = store.actions.addMedia(root, [imageInput])!
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

  test('is a no-op for a gif media id', () => {
    const store = makeStore()
    const root = rootId(store)
    const [gifId] = store.actions.addMedia(root, [gifInput])!
    const before = store.getState()
    store.actions.retryMediaUpload(root, gifId)
    expect(store.getState()).toBe(before)
  })

  test('is a no-op when post or media id is unknown', () => {
    const store = makeStore()
    const root = rootId(store)
    store.actions.addMedia(root, [imageInput])
    const before = store.getState()
    store.actions.retryMediaUpload(root, 'does-not-exist')
    expect(store.getState()).toBe(before)
    store.actions.retryMediaUpload('nope', 'whatever')
    expect(store.getState()).toBe(before)
  })
})

describe('updateMediaAltText', () => {
  test('updates only the matching media (image)', () => {
    const store = makeStore()
    const root = rootId(store)
    const [a, b] = store.actions.addMedia(root, [imageInput, imageInput])!
    store.actions.updateMediaAltText(root, b, 'a description')

    const media = getMedia(store, root)
    expect(media.find(m => m.id === a)?.altText).toBe('')
    expect(media.find(m => m.id === b)?.altText).toBe('a description')
  })

  test('works on a gif as well', () => {
    const store = makeStore()
    const root = rootId(store)
    const [gifId] = store.actions.addMedia(root, [gifInput])!
    store.actions.updateMediaAltText(root, gifId, 'animated joy')
    expect(getMedia(store, root)[0].altText).toBe('animated joy')
  })

  test('is a no-op when alt text is unchanged', () => {
    const store = makeStore()
    const root = rootId(store)
    const [imageId] = store.actions.addMedia(root, [imageInput])!
    const before = store.getState()
    store.actions.updateMediaAltText(root, imageId, '')
    expect(store.getState()).toBe(before)
  })
})

describe('removePost cancels media uploads', () => {
  test('removing a post cancels any in-flight uploads on that post', () => {
    const store = makeStore()
    const a = rootId(store)
    const b = store.actions.addPost('after', a)
    store.actions.addMedia(b, [imageInput])
    jest.advanceTimersByTime(100)

    store.actions.removePost(b)
    expect(() => jest.runAllTimers()).not.toThrow()
    expect(Object.keys(store.getState().posts)).toEqual([a])
  })
})

describe('destroy cancels uploads', () => {
  test('destroy stops any in-flight uploads', () => {
    const store = makeStore()
    const root = rootId(store)
    store.actions.addMedia(root, [imageInput])
    jest.advanceTimersByTime(100)
    store.destroy()
    expect(() => jest.runAllTimers()).not.toThrow()
  })
})
