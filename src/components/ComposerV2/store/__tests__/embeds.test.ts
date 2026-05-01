import {type AtpAgent} from '@atproto/api'
import {describe, expect, test} from '@jest/globals'

import {createThreadStore} from '#/components/ComposerV2/store'

function makeIdGenerator() {
  let i = 0
  return () => `id-${++i}`
}

const agent = {} as AtpAgent

function rootId(store: ReturnType<typeof createThreadStore>) {
  return Object.keys(store.getState().posts)[0]
}

describe('setExternalEmbed / removeExternalEmbed', () => {
  test('sets the external embed and marks state dirty', () => {
    const store = createThreadStore({agent, __createId: makeIdGenerator()})
    const root = rootId(store)
    store.actions.setExternalEmbed(root, {uri: 'https://example.com'})
    expect(store.getState().posts[root].external).toEqual({
      uri: 'https://example.com',
    })
    expect(store.getState().isDirty).toBe(true)
  })

  test('replaces an existing external embed', () => {
    const store = createThreadStore({agent, __createId: makeIdGenerator()})
    const root = rootId(store)
    store.actions.setExternalEmbed(root, {uri: 'https://a.example'})
    store.actions.setExternalEmbed(root, {uri: 'https://b.example'})
    expect(store.getState().posts[root].external?.uri).toBe('https://b.example')
  })

  test('removeExternalEmbed clears the external embed', () => {
    const store = createThreadStore({agent, __createId: makeIdGenerator()})
    const root = rootId(store)
    store.actions.setExternalEmbed(root, {uri: 'https://example.com'})
    store.actions.removeExternalEmbed(root)
    expect(store.getState().posts[root].external).toBeUndefined()
  })

  test('removeExternalEmbed is a no-op when nothing is set', () => {
    const store = createThreadStore({agent, __createId: makeIdGenerator()})
    const before = store.getState()
    store.actions.removeExternalEmbed(rootId(store))
    expect(store.getState()).toBe(before)
  })

  test('setExternalEmbed is a no-op when post id is unknown', () => {
    const store = createThreadStore({agent, __createId: makeIdGenerator()})
    const before = store.getState()
    store.actions.setExternalEmbed('does-not-exist', {uri: 'https://x'})
    expect(store.getState()).toBe(before)
  })
})

describe('setQuoteEmbed / removeQuoteEmbed', () => {
  test('sets the quote embed and marks state dirty', () => {
    const store = createThreadStore({agent, __createId: makeIdGenerator()})
    const root = rootId(store)
    store.actions.setQuoteEmbed(root, {uri: 'at://x', cid: 'c'})
    expect(store.getState().posts[root].quote).toEqual({
      uri: 'at://x',
      cid: 'c',
    })
    expect(store.getState().isDirty).toBe(true)
  })

  test('replaces an existing quote embed', () => {
    const store = createThreadStore({agent, __createId: makeIdGenerator()})
    const root = rootId(store)
    store.actions.setQuoteEmbed(root, {uri: 'at://a', cid: 'ca'})
    store.actions.setQuoteEmbed(root, {uri: 'at://b', cid: 'cb'})
    expect(store.getState().posts[root].quote).toEqual({
      uri: 'at://b',
      cid: 'cb',
    })
  })

  test('removeQuoteEmbed clears the quote', () => {
    const store = createThreadStore({agent, __createId: makeIdGenerator()})
    const root = rootId(store)
    store.actions.setQuoteEmbed(root, {uri: 'at://x', cid: 'c'})
    store.actions.removeQuoteEmbed(root)
    expect(store.getState().posts[root].quote).toBeUndefined()
  })

  test('removeQuoteEmbed is a no-op when nothing is set', () => {
    const store = createThreadStore({agent, __createId: makeIdGenerator()})
    const before = store.getState()
    store.actions.removeQuoteEmbed(rootId(store))
    expect(store.getState()).toBe(before)
  })

  test('setQuoteEmbed is a no-op when post id is unknown', () => {
    const store = createThreadStore({agent, __createId: makeIdGenerator()})
    const before = store.getState()
    store.actions.setQuoteEmbed('does-not-exist', {uri: 'at://x', cid: 'c'})
    expect(store.getState()).toBe(before)
  })
})
