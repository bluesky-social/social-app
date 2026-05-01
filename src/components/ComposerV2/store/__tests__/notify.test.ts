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

describe('subscribe / getState', () => {
  test('listener fires on a real change and getState returns a new reference', () => {
    const store = createThreadStore({agent, __createId: makeIdGenerator()})
    const root = rootId(store)
    const before = store.getState()
    const fn = jest.fn()
    const unsubscribe = store.subscribe(fn)

    store.actions.setPostText(root, 'hello')

    expect(fn).toHaveBeenCalledTimes(1)
    const after = store.getState()
    expect(after).not.toBe(before)
    expect(after.posts[root].text).toBe('hello')
    unsubscribe()
  })

  test('listener does not fire on a no-op and state ref is preserved', () => {
    const store = createThreadStore({agent, __createId: makeIdGenerator()})
    const before = store.getState()
    const fn = jest.fn()
    store.subscribe(fn)

    store.actions.setPostText('does-not-exist', 'hello')

    expect(fn).not.toHaveBeenCalled()
    expect(store.getState()).toBe(before)
  })

  test('unsubscribed listeners stop receiving notifications', () => {
    const store = createThreadStore({agent, __createId: makeIdGenerator()})
    const root = rootId(store)
    const fn = jest.fn()
    const unsubscribe = store.subscribe(fn)

    store.actions.setPostText(root, 'a')
    expect(fn).toHaveBeenCalledTimes(1)
    unsubscribe()
    store.actions.setPostText(root, 'b')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  test('destroy clears subscribers and stops further notifications', () => {
    const store = createThreadStore({agent, __createId: makeIdGenerator()})
    const root = rootId(store)
    const fn = jest.fn()
    store.subscribe(fn)

    store.destroy()
    store.actions.setPostText(root, 'after destroy')
    expect(fn).not.toHaveBeenCalled()
  })
})
