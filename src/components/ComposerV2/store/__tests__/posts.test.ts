import {type AtpAgent} from '@atproto/api'
import {describe, expect, jest, test} from '@jest/globals'

// Avoid pulling the UI module chain into the test environment via the
// resolveLink import in linkResolution.ts.
jest.mock('#/lib/api/resolve', () => ({
  resolveLink: jest.fn(),
}))
jest.mock('#/state/session/agent', () => ({
  createPublicAgent: jest.fn(() => ({})),
}))

import {createThreadStore} from '#/components/ComposerV2/store'

function makeIdGenerator() {
  let i = 0
  return () => `id-${++i}`
}

const agent = {} as AtpAgent

function rootId(store: ReturnType<typeof createThreadStore>) {
  return Object.keys(store.getState().posts)[0]
}

describe('addPost("after")', () => {
  test('inserts a new post immediately after the target and returns its id', () => {
    const store = createThreadStore({agent, __createId: makeIdGenerator()})
    const root = rootId(store)
    expect(root).toBe('id-1')

    const second = store.actions.addPost('after', root)
    expect(second).toBe('id-2')
    expect(Object.keys(store.getState().posts)).toEqual(['id-1', 'id-2'])
  })

  test('inserts mid-thread without disturbing surrounding order', () => {
    const store = createThreadStore({agent, __createId: makeIdGenerator()})
    const root = rootId(store)
    const second = store.actions.addPost('after', root) // id-2
    const third = store.actions.addPost('after', second) // id-3
    const between = store.actions.addPost('after', root) // id-4
    expect(Object.keys(store.getState().posts)).toEqual([
      root,
      between,
      second,
      third,
    ])
  })

  test('marks state dirty', () => {
    const store = createThreadStore({agent, __createId: makeIdGenerator()})
    expect(store.getState().isDirty).toBe(false)
    store.actions.addPost('after', rootId(store))
    expect(store.getState().isDirty).toBe(true)
  })

  test('is a no-op when the target id is unknown', () => {
    const store = createThreadStore({agent, __createId: makeIdGenerator()})
    const before = store.getState()
    store.actions.addPost('after', 'does-not-exist')
    expect(store.getState()).toBe(before)
    expect(Object.keys(store.getState().posts).length).toBe(1)
  })
})

describe('addPost("before")', () => {
  test('inserts a new post immediately before the target and returns its id', () => {
    const store = createThreadStore({agent, __createId: makeIdGenerator()})
    const root = rootId(store)
    const newId = store.actions.addPost('before', root)
    expect(newId).toBe('id-2')
    expect(Object.keys(store.getState().posts)).toEqual([newId, root])
  })

  test('inserts mid-thread without disturbing surrounding order', () => {
    const store = createThreadStore({agent, __createId: makeIdGenerator()})
    const a = rootId(store)
    const b = store.actions.addPost('after', a)
    const c = store.actions.addPost('after', b)
    const before = store.actions.addPost('before', c)
    expect(Object.keys(store.getState().posts)).toEqual([a, b, before, c])
  })

  test('is a no-op when the target id is unknown', () => {
    const store = createThreadStore({agent, __createId: makeIdGenerator()})
    const before = store.getState()
    store.actions.addPost('before', 'does-not-exist')
    expect(store.getState()).toBe(before)
  })
})

describe('removePost', () => {
  test('removes the matching post and marks dirty', () => {
    const store = createThreadStore({agent, __createId: makeIdGenerator()})
    const a = rootId(store)
    const b = store.actions.addPost('after', a)
    store.actions.removePost(b)
    expect(Object.keys(store.getState().posts)).toEqual([a])
    expect(store.getState().isDirty).toBe(true)
  })

  test('refuses to remove the last remaining post', () => {
    const store = createThreadStore({agent, __createId: makeIdGenerator()})
    const a = rootId(store)
    const before = store.getState()
    store.actions.removePost(a)
    expect(store.getState()).toBe(before)
    expect(Object.keys(store.getState().posts).length).toBe(1)
  })

  test('is a no-op when postId is unknown', () => {
    const store = createThreadStore({agent, __createId: makeIdGenerator()})
    store.actions.addPost('after', rootId(store))
    const before = store.getState()
    store.actions.removePost('does-not-exist')
    expect(store.getState()).toBe(before)
    expect(Object.keys(store.getState().posts).length).toBe(2)
  })
})
