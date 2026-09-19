import {describe, expect, jest, test} from '@jest/globals'

/* Avoid loading the UI module chain through the real link resolver. */
jest.mock('#/lib/api/resolve', () => ({
  resolveLink: jest.fn(),
}))

import {type LinkResolvers} from '#/lib/api/resolve'
import {createThreadStore} from '#/components/ComposerV2/store'

function makeIdGenerator() {
  let i = 0
  return () => `id-${++i}`
}

const resolvers = {} as LinkResolvers

function makeStore() {
  return createThreadStore({
    resolvers,
    __createId: makeIdGenerator(),
  })
}

function rootId(store: ReturnType<typeof createThreadStore>) {
  return Object.keys(store.getState().posts)[0]
}

describe('addPost("after")', () => {
  test('inserts a new post immediately after the target and returns its id', () => {
    const store = makeStore()
    const root = rootId(store)
    expect(root).toBe('id-1')

    const result = store.actions.addPost('after', root)
    expect(result).toEqual({addedPostId: 'id-2'})
    const second = result!.addedPostId
    expect(Object.keys(store.getState().posts)).toEqual(['id-1', second])
  })

  test('inserts mid-thread without disturbing surrounding order', () => {
    const store = makeStore()
    const root = rootId(store)
    const second = store.actions.addPost('after', root)!.addedPostId // id-2
    const third = store.actions.addPost('after', second)!.addedPostId // id-3
    const between = store.actions.addPost('after', root)!.addedPostId // id-4
    expect(Object.keys(store.getState().posts)).toEqual([
      root,
      between,
      second,
      third,
    ])
  })

  test('marks state dirty', () => {
    const store = makeStore()
    expect(store.getState().isDirty).toBe(false)
    const result = store.actions.addPost('after', rootId(store))
    expect(result).toEqual({addedPostId: 'id-2'})
    expect(store.getState().isDirty).toBe(true)
  })

  test('is a no-op when the target id is unknown', () => {
    const store = makeStore()
    const before = store.getState()
    const notify = jest.fn()
    store.subscribe(notify)
    const result = store.actions.addPost('after', 'does-not-exist')
    expect(result).toBeUndefined()
    expect(store.getState()).toBe(before)
    expect(notify).not.toHaveBeenCalled()
    expect(store.getState().isDirty).toBe(false)
    expect(Object.keys(store.getState().posts).length).toBe(1)
  })
  test('returns undefined after the store is destroyed', () => {
    const store = makeStore()
    const root = rootId(store)
    const before = store.getState()
    store.destroy()

    expect(store.actions.addPost('after', root)).toBeUndefined()
    expect(store.getState()).toBe(before)
    expect(Object.keys(store.getState().posts)).toEqual([root])
  })
})

describe('addPost("before")', () => {
  test('inserts a new post immediately before the target and returns its id', () => {
    const store = makeStore()
    const root = rootId(store)
    const result = store.actions.addPost('before', root)
    expect(result).toEqual({addedPostId: 'id-2'})
    const newId = result!.addedPostId
    expect(Object.keys(store.getState().posts)).toEqual([newId, root])
  })

  test('inserts mid-thread without disturbing surrounding order', () => {
    const store = makeStore()
    const a = rootId(store)
    const b = store.actions.addPost('after', a)!.addedPostId
    const c = store.actions.addPost('after', b)!.addedPostId
    const before = store.actions.addPost('before', c)!.addedPostId
    expect(Object.keys(store.getState().posts)).toEqual([a, b, before, c])
  })

  test('is a no-op when the target id is unknown', () => {
    const store = makeStore()
    const before = store.getState()
    const result = store.actions.addPost('before', 'does-not-exist')
    expect(result).toBeUndefined()
    expect(store.getState()).toBe(before)
  })
})

describe('removePost', () => {
  test('removes the matching post and marks dirty', () => {
    const store = makeStore()
    const a = rootId(store)
    const b = store.actions.addPost('after', a)!.addedPostId
    store.actions.removePost(b)
    expect(Object.keys(store.getState().posts)).toEqual([a])
    expect(store.getState().isDirty).toBe(true)
  })

  test('refuses to remove the last remaining post', () => {
    const store = makeStore()
    const a = rootId(store)
    const before = store.getState()
    store.actions.removePost(a)
    expect(store.getState()).toBe(before)
    expect(Object.keys(store.getState().posts).length).toBe(1)
  })

  test('is a no-op when postId is unknown', () => {
    const store = makeStore()
    store.actions.addPost('after', rootId(store))
    const before = store.getState()
    store.actions.removePost('does-not-exist')
    expect(store.getState()).toBe(before)
    expect(Object.keys(store.getState().posts).length).toBe(2)
  })
})
