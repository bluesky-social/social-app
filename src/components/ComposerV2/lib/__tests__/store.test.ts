import {beforeEach, describe, expect, jest, test} from '@jest/globals'
import {type AtpAgent} from '@atproto/api'

import {createComposerStore} from '#/components/ComposerV2/lib/store'

// Deterministic ids: 'id-1', 'id-2', ... so tests can assert on them.
function makeIdGenerator() {
  let i = 0
  return () => `id-${++i}`
}

// We never call the agent in these tests; just satisfy the type.
const agent = {} as AtpAgent

describe('createComposerStore - basics', () => {
  test('seeds with one empty post', () => {
    const store = createComposerStore({agent, idGenerator: makeIdGenerator()})
    const state = store.getState()
    expect(state.posts).toHaveLength(1)
    expect(state.posts[0].id).toBe('id-1')
  })

  test('subscribers are notified on state change', () => {
    const store = createComposerStore({agent, idGenerator: makeIdGenerator()})
    const fn = jest.fn()
    const unsubscribe = store.subscribe(fn)
    store.actions.updateText('id-1', 'hi')
    expect(fn).toHaveBeenCalledTimes(1)
    unsubscribe()
    store.actions.updateText('id-1', 'hi again')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  test('subscribers are not notified when state is unchanged', () => {
    const store = createComposerStore({agent, idGenerator: makeIdGenerator()})
    const fn = jest.fn()
    store.subscribe(fn)
    // Same text as initial empty string -> no-op
    store.actions.updateText('id-1', '')
    expect(fn).not.toHaveBeenCalled()
  })

  test('appendPost returns the new post id and appends it', () => {
    const store = createComposerStore({agent, idGenerator: makeIdGenerator()})
    const newId = store.actions.appendPost()
    expect(newId).toBe('id-2')
    expect(store.getState().posts.map(p => p.id)).toEqual(['id-1', 'id-2'])
  })

  test('removePost works and refuses to remove the last post', () => {
    const store = createComposerStore({agent, idGenerator: makeIdGenerator()})
    store.actions.appendPost()
    store.actions.removePost('id-2')
    expect(store.getState().posts.map(p => p.id)).toEqual(['id-1'])
    // Last post is sticky
    store.actions.removePost('id-1')
    expect(store.getState().posts.map(p => p.id)).toEqual(['id-1'])
  })

  test('destroy stops applying actions and clears subscribers', () => {
    const store = createComposerStore({agent, idGenerator: makeIdGenerator()})
    const fn = jest.fn()
    store.subscribe(fn)
    store.destroy()
    store.actions.updateText('id-1', 'after destroy')
    expect(fn).not.toHaveBeenCalled()
    expect(store.getState().posts[0].text).toBe('')
  })
})

describe('createComposerStore - simulated image uploads', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  test('addImages drives upload state from pending -> uploading -> uploaded', () => {
    const store = createComposerStore({agent, idGenerator: makeIdGenerator()})
    // Each addImages call uses 2 ids (one for the image id, one for its localRefPath),
    // so the image id is 'id-2' here.
    const ids = store.actions.addImages('id-1', [
      {uri: 'file:///a.jpg', width: 10, height: 10},
    ])
    expect(ids).toEqual(['id-2'])

    const get = () => {
      const post = store.getState().posts[0]
      if (post.media?.kind !== 'images') throw new Error('expected images')
      return post.media.items[0].upload
    }

    expect(get().state).toBe('pending')
    jest.advanceTimersByTime(100)
    expect(get().state).toBe('uploading')
    // Run all remaining timers to completion
    jest.runAllTimers()
    expect(get().state).toBe('uploaded')
  })

  test('removing an image while uploading does not throw and leaves state stable', () => {
    const store = createComposerStore({agent, idGenerator: makeIdGenerator()})
    const [imageId] = store.actions.addImages('id-1', [
      {uri: 'file:///a.jpg', width: 10, height: 10},
    ])
    jest.advanceTimersByTime(100)
    store.actions.removeImage('id-1', imageId)
    // Drain the rest of the simulated upload - setUploadStatus should silently
    // no-op since the media is gone.
    expect(() => jest.runAllTimers()).not.toThrow()
    expect(store.getState().posts[0].media).toBeUndefined()
  })
})
