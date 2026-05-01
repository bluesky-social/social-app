import {
  type AppBskyFeedDefs,
  type AppBskyGraphDefs,
  type AtpAgent,
} from '@atproto/api'
import {beforeEach, describe, expect, jest, test} from '@jest/globals'

// Avoid pulling the UI module chain (gallery → media picker → ALF) into the
// test environment. Tests inject `__resolveLink` directly, so the real
// implementation is never invoked.
jest.mock('#/lib/api/resolve', () => ({
  resolveLink: jest.fn(),
}))
jest.mock('#/state/session/agent', () => ({
  createPublicAgent: jest.fn(() => ({})),
}))

import {type ResolvedLink, type resolveLink} from '#/lib/api/resolve'
import {createThreadStore} from '#/components/ComposerV2/store'

function makeIdGenerator() {
  let i = 0
  return () => `id-${++i}`
}

const agent = {} as AtpAgent

function rootId(store: ReturnType<typeof createThreadStore>) {
  return Object.keys(store.getState().posts)[0]
}

function deferred<T>() {
  let resolve!: (v: T) => void
  let reject!: (err: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return {promise, resolve, reject}
}

async function flushPromises() {
  await new Promise(resolve => setImmediate(resolve))
}

let mockResolveLink: jest.Mock<typeof resolveLink>

beforeEach(() => {
  mockResolveLink = jest.fn() as unknown as jest.Mock<typeof resolveLink>
})

function makeStore() {
  return createThreadStore({
    agent,
    __createId: makeIdGenerator(),
    __resolveLink: mockResolveLink as unknown as typeof resolveLink,
  })
}

const fakePostView = (uri: string, cid: string) =>
  ({uri, cid}) as unknown as AppBskyFeedDefs.PostView

const fakeGeneratorView = (uri: string, cid: string) =>
  ({uri, cid}) as unknown as AppBskyFeedDefs.GeneratorView

const fakeListView = (uri: string, cid: string) =>
  ({uri, cid}) as unknown as AppBskyGraphDefs.ListView

const fakeStarterPackView = (uri: string, cid: string) =>
  ({uri, cid}) as unknown as AppBskyGraphDefs.StarterPackView

const postLink: ResolvedLink = {
  type: 'record',
  kind: 'post',
  record: {uri: 'at://post', cid: 'cp'},
  view: fakePostView('at://post', 'cp'),
}

const feedLink: ResolvedLink = {
  type: 'record',
  kind: 'feed',
  record: {uri: 'at://feed', cid: 'cf'},
  view: fakeGeneratorView('at://feed', 'cf'),
}

const listLink: ResolvedLink = {
  type: 'record',
  kind: 'list',
  record: {uri: 'at://list', cid: 'cl'},
  view: fakeListView('at://list', 'cl'),
}

const starterPackLink: ResolvedLink = {
  type: 'record',
  kind: 'starter-pack',
  record: {uri: 'at://sp', cid: 'csp'},
  view: fakeStarterPackView('at://sp', 'csp'),
}

const externalLink: ResolvedLink = {
  type: 'external',
  uri: 'https://example.com',
  title: 'Example',
  description: 'A description',
  thumb: undefined,
}

describe('addUri routes outcomes', () => {
  test('post → quote (with view), embed cleared', async () => {
    const d = deferred<ResolvedLink>()
    mockResolveLink.mockReturnValueOnce(d.promise)
    const store = makeStore()
    const root = rootId(store)
    store.actions.addUri(root, 'https://bsky.app/post')
    expect(store.getState().posts[root].embed?.state).toBe('pending')

    d.resolve(postLink)
    await flushPromises()

    const post = store.getState().posts[root]
    expect(post.embed).toBeUndefined()
    expect(post.quote).toEqual({
      uri: 'at://post',
      cid: 'cp',
      view: postLink.kind === 'post' ? postLink.view : undefined,
    })
  })

  test('feed → embed.feed', async () => {
    const d = deferred<ResolvedLink>()
    mockResolveLink.mockReturnValueOnce(d.promise)
    const store = makeStore()
    const root = rootId(store)
    store.actions.addUri(root, 'https://bsky.app/feed')
    d.resolve(feedLink)
    await flushPromises()
    expect(store.getState().posts[root].embed?.state).toBe('feed')
  })

  test('list → embed.list', async () => {
    const d = deferred<ResolvedLink>()
    mockResolveLink.mockReturnValueOnce(d.promise)
    const store = makeStore()
    const root = rootId(store)
    store.actions.addUri(root, 'https://bsky.app/list')
    d.resolve(listLink)
    await flushPromises()
    expect(store.getState().posts[root].embed?.state).toBe('list')
  })

  test('starter-pack → embed["starter-pack"]', async () => {
    const d = deferred<ResolvedLink>()
    mockResolveLink.mockReturnValueOnce(d.promise)
    const store = makeStore()
    const root = rootId(store)
    store.actions.addUri(root, 'https://bsky.app/sp')
    d.resolve(starterPackLink)
    await flushPromises()
    expect(store.getState().posts[root].embed?.state).toBe('starter-pack')
  })

  test('external → embed.external', async () => {
    const d = deferred<ResolvedLink>()
    mockResolveLink.mockReturnValueOnce(d.promise)
    const store = makeStore()
    const root = rootId(store)
    store.actions.addUri(root, 'https://example.com')
    d.resolve(externalLink)
    await flushPromises()
    const embed = store.getState().posts[root].embed
    if (embed?.state !== 'external') throw new Error('expected external')
    expect(embed.title).toBe('Example')
  })

  test('post outcome dropped when quote is already set', async () => {
    const d = deferred<ResolvedLink>()
    mockResolveLink.mockReturnValueOnce(d.promise)
    const store = makeStore()
    const root = rootId(store)
    store.actions.setQuoteEmbed(root, {uri: 'at://existing', cid: 'cx'})
    store.actions.addUri(root, 'https://bsky.app/post')
    d.resolve(postLink)
    await flushPromises()
    expect(store.getState().posts[root].quote).toEqual({
      uri: 'at://existing',
      cid: 'cx',
    })
    expect(store.getState().posts[root].embed).toBeUndefined()
  })

  test('non-post outcome with media present is silently dropped', async () => {
    const d = deferred<ResolvedLink>()
    mockResolveLink.mockReturnValueOnce(d.promise)
    const store = makeStore()
    const root = rootId(store)
    store.actions.addMedia(root, [
      {kind: 'image', uri: 'file:///a.jpg', width: 10, height: 10},
    ])
    store.actions.addUri(root, 'https://example.com')
    d.resolve(externalLink)
    await flushPromises()
    expect(store.getState().posts[root].embed).toBeUndefined()
    expect(store.getState().posts[root].media).toHaveLength(1)
  })

  test('post outcome with media present routes to quote', async () => {
    const d = deferred<ResolvedLink>()
    mockResolveLink.mockReturnValueOnce(d.promise)
    const store = makeStore()
    const root = rootId(store)
    store.actions.addMedia(root, [
      {kind: 'image', uri: 'file:///a.jpg', width: 10, height: 10},
    ])
    store.actions.addUri(root, 'https://bsky.app/post')
    d.resolve(postLink)
    await flushPromises()
    expect(store.getState().posts[root].quote?.uri).toBe('at://post')
    expect(store.getState().posts[root].media).toHaveLength(1)
  })
})

describe('addUri failure and retry', () => {
  test('rejection produces a failed embed with a bound retry()', async () => {
    const d1 = deferred<ResolvedLink>()
    const d2 = deferred<ResolvedLink>()
    mockResolveLink
      .mockReturnValueOnce(d1.promise)
      .mockReturnValueOnce(d2.promise)
    const store = makeStore()
    const root = rootId(store)
    store.actions.addUri(root, 'https://example.com')
    d1.reject(new Error('network down'))
    await flushPromises()

    const failed = store.getState().posts[root].embed
    if (failed?.state !== 'failed') throw new Error('expected failed')
    expect(failed.error).toContain('network down')

    failed.retry()
    expect(store.getState().posts[root].embed?.state).toBe('pending')

    d2.resolve(externalLink)
    await flushPromises()
    expect(store.getState().posts[root].embed?.state).toBe('external')
  })
})

describe('addUri cancellation', () => {
  test('a second addUri invalidates the first response', async () => {
    const d1 = deferred<ResolvedLink>()
    const d2 = deferred<ResolvedLink>()
    mockResolveLink
      .mockReturnValueOnce(d1.promise)
      .mockReturnValueOnce(d2.promise)
    const store = makeStore()
    const root = rootId(store)
    store.actions.addUri(root, 'https://a.example')
    store.actions.addUri(root, 'https://b.example')
    d1.resolve(externalLink)
    await flushPromises()
    const pending = store.getState().posts[root].embed
    if (pending?.state !== 'pending') throw new Error('expected pending')
    expect(pending.uri).toBe('https://b.example')
  })

  test('removeEmbed before the response lands keeps embed undefined', async () => {
    const d = deferred<ResolvedLink>()
    mockResolveLink.mockReturnValueOnce(d.promise)
    const store = makeStore()
    const root = rootId(store)
    store.actions.addUri(root, 'https://example.com')
    store.actions.removeEmbed(root)
    d.resolve(externalLink)
    await flushPromises()
    expect(store.getState().posts[root].embed).toBeUndefined()
  })
})

describe('setQuoteEmbed / removeQuoteEmbed', () => {
  test('sets the quote embed and marks state dirty', () => {
    const store = makeStore()
    const root = rootId(store)
    store.actions.setQuoteEmbed(root, {uri: 'at://x', cid: 'c'})
    expect(store.getState().posts[root].quote).toEqual({
      uri: 'at://x',
      cid: 'c',
    })
    expect(store.getState().isDirty).toBe(true)
  })

  test('removeQuoteEmbed clears the quote', () => {
    const store = makeStore()
    const root = rootId(store)
    store.actions.setQuoteEmbed(root, {uri: 'at://x', cid: 'c'})
    store.actions.removeQuoteEmbed(root)
    expect(store.getState().posts[root].quote).toBeUndefined()
  })
})
