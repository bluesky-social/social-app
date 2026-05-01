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

const POST_URL = 'https://bsky.app/profile/test.bsky.social/post/abc'
const EXTERNAL_URL = 'https://example.com'

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
  uri: EXTERNAL_URL,
  title: 'Example',
  description: 'A description',
  thumb: undefined,
}

describe('addUri pre-classifies bsky post URLs to the quote slot', () => {
  test('post URL → quote.pending → quote.resolved (with view)', async () => {
    const d = deferred<ResolvedLink>()
    mockResolveLink.mockReturnValueOnce(d.promise)
    const store = makeStore()
    const root = rootId(store)
    store.actions.addUri(root, POST_URL)

    const pending = store.getState().posts[root].quote
    if (pending?.state !== 'pending') throw new Error('expected pending')
    expect(pending.uri).toBe(POST_URL)
    expect(store.getState().posts[root].embed).toBeUndefined()

    d.resolve(postLink)
    await flushPromises()

    const quote = store.getState().posts[root].quote
    if (quote?.state !== 'resolved') throw new Error('expected resolved')
    expect(quote.uri).toBe('at://post')
    expect(quote.cid).toBe('cp')
    expect(quote.view).toBe(
      postLink.kind === 'post' ? postLink.view : undefined,
    )
  })

  test('addUri is a no-op when quote is already set', () => {
    const store = makeStore()
    const root = rootId(store)
    store.actions.setQuoteEmbed(root, {uri: 'at://existing', cid: 'cx'})
    const before = store.getState()
    store.actions.addUri(root, POST_URL)
    expect(store.getState()).toBe(before)
    expect(mockResolveLink).not.toHaveBeenCalled()
  })

  test('post URL with media still routes to quote (orthogonal to media)', async () => {
    const d = deferred<ResolvedLink>()
    mockResolveLink.mockReturnValueOnce(d.promise)
    const store = makeStore()
    const root = rootId(store)
    store.actions.addMedia(root, [
      {kind: 'image', uri: 'file:///a.jpg', width: 10, height: 10},
    ])
    store.actions.addUri(root, POST_URL)
    d.resolve(postLink)
    await flushPromises()
    expect(store.getState().posts[root].quote?.state).toBe('resolved')
    expect(store.getState().posts[root].media).toHaveLength(1)
  })

  test('post resolution failure produces quote.failed with bound retry()', async () => {
    const d1 = deferred<ResolvedLink>()
    const d2 = deferred<ResolvedLink>()
    mockResolveLink
      .mockReturnValueOnce(d1.promise)
      .mockReturnValueOnce(d2.promise)
    const store = makeStore()
    const root = rootId(store)
    store.actions.addUri(root, POST_URL)
    d1.reject(new Error('post deleted'))
    await flushPromises()

    const failed = store.getState().posts[root].quote
    if (failed?.state !== 'failed') throw new Error('expected failed')
    expect(failed.error).toContain('post deleted')
    expect(typeof failed.retry).toBe('function')

    failed.retry()
    expect(store.getState().posts[root].quote?.state).toBe('pending')

    d2.resolve(postLink)
    await flushPromises()
    expect(store.getState().posts[root].quote?.state).toBe('resolved')
  })
})

describe('addUri pre-classifies non-post URLs to the embed slot', () => {
  test('feed → embed.feed', async () => {
    const d = deferred<ResolvedLink>()
    mockResolveLink.mockReturnValueOnce(d.promise)
    const store = makeStore()
    const root = rootId(store)
    store.actions.addUri(root, EXTERNAL_URL)
    expect(store.getState().posts[root].embed?.state).toBe('pending')
    d.resolve(feedLink)
    await flushPromises()
    expect(store.getState().posts[root].embed?.state).toBe('feed')
  })

  test('list → embed.list', async () => {
    const d = deferred<ResolvedLink>()
    mockResolveLink.mockReturnValueOnce(d.promise)
    const store = makeStore()
    const root = rootId(store)
    store.actions.addUri(root, EXTERNAL_URL)
    d.resolve(listLink)
    await flushPromises()
    expect(store.getState().posts[root].embed?.state).toBe('list')
  })

  test('starter-pack → embed["starter-pack"]', async () => {
    const d = deferred<ResolvedLink>()
    mockResolveLink.mockReturnValueOnce(d.promise)
    const store = makeStore()
    const root = rootId(store)
    store.actions.addUri(root, EXTERNAL_URL)
    d.resolve(starterPackLink)
    await flushPromises()
    expect(store.getState().posts[root].embed?.state).toBe('starter-pack')
  })

  test('external → embed.external', async () => {
    const d = deferred<ResolvedLink>()
    mockResolveLink.mockReturnValueOnce(d.promise)
    const store = makeStore()
    const root = rootId(store)
    store.actions.addUri(root, EXTERNAL_URL)
    d.resolve(externalLink)
    await flushPromises()
    const embed = store.getState().posts[root].embed
    if (embed?.state !== 'external') throw new Error('expected external')
    expect(embed.title).toBe('Example')
  })

  test('addUri is a no-op when embed has settled (resolved)', async () => {
    const d = deferred<ResolvedLink>()
    mockResolveLink.mockReturnValueOnce(d.promise)
    const store = makeStore()
    const root = rootId(store)
    store.actions.addUri(root, EXTERNAL_URL)
    d.resolve(externalLink)
    await flushPromises()
    expect(store.getState().posts[root].embed?.state).toBe('external')

    store.actions.addUri(root, 'https://other.example')
    // Settled slot blocks the second addUri.
    expect(mockResolveLink).toHaveBeenCalledTimes(1)
    expect(store.getState().posts[root].embed?.state).toBe('external')
  })

  test('addUri replaces a pending embed (e.g. user pastes a different URL)', () => {
    mockResolveLink.mockReturnValue(new Promise(() => {}))
    const store = makeStore()
    const root = rootId(store)
    store.actions.addUri(root, EXTERNAL_URL)
    store.actions.addUri(root, 'https://other.example')
    expect(mockResolveLink).toHaveBeenCalledTimes(2)
    const embed = store.getState().posts[root].embed
    if (embed?.state !== 'pending') throw new Error('expected pending')
    expect(embed.uri).toBe('https://other.example')
  })

  test('addUri is a no-op when media is set (target is embed)', () => {
    const store = makeStore()
    const root = rootId(store)
    store.actions.addMedia(root, [
      {kind: 'image', uri: 'file:///a.jpg', width: 10, height: 10},
    ])
    store.actions.addUri(root, EXTERNAL_URL)
    expect(store.getState().posts[root].embed).toBeUndefined()
    expect(mockResolveLink).not.toHaveBeenCalled()
  })

  test('embed resolution failure produces embed.failed with bound retry()', async () => {
    const d1 = deferred<ResolvedLink>()
    const d2 = deferred<ResolvedLink>()
    mockResolveLink
      .mockReturnValueOnce(d1.promise)
      .mockReturnValueOnce(d2.promise)
    const store = makeStore()
    const root = rootId(store)
    store.actions.addUri(root, EXTERNAL_URL)
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

describe('addUri cancellation by ignoring stale responses', () => {
  test('removeEmbed before the response lands keeps embed undefined', async () => {
    const d = deferred<ResolvedLink>()
    mockResolveLink.mockReturnValueOnce(d.promise)
    const store = makeStore()
    const root = rootId(store)
    store.actions.addUri(root, EXTERNAL_URL)
    store.actions.removeEmbed(root)
    d.resolve(externalLink)
    await flushPromises()
    expect(store.getState().posts[root].embed).toBeUndefined()
  })

  test('removeQuoteEmbed before the response lands keeps quote undefined', async () => {
    const d = deferred<ResolvedLink>()
    mockResolveLink.mockReturnValueOnce(d.promise)
    const store = makeStore()
    const root = rootId(store)
    store.actions.addUri(root, POST_URL)
    store.actions.removeQuoteEmbed(root)
    d.resolve(postLink)
    await flushPromises()
    expect(store.getState().posts[root].quote).toBeUndefined()
  })

  test('removeEmbed does not invalidate an in-flight quote resolution', async () => {
    const d = deferred<ResolvedLink>()
    mockResolveLink.mockReturnValueOnce(d.promise)
    const store = makeStore()
    const root = rootId(store)
    store.actions.addUri(root, POST_URL)
    store.actions.removeEmbed(root) // unrelated slot
    d.resolve(postLink)
    await flushPromises()
    expect(store.getState().posts[root].quote?.state).toBe('resolved')
  })
})

describe('setQuoteEmbed / removeQuoteEmbed', () => {
  test('sets the quote embed and marks state dirty', () => {
    const store = makeStore()
    const root = rootId(store)
    store.actions.setQuoteEmbed(root, {uri: 'at://x', cid: 'c'})
    const quote = store.getState().posts[root].quote
    if (quote?.state !== 'resolved') throw new Error('expected resolved')
    expect(quote.uri).toBe('at://x')
    expect(quote.cid).toBe('c')
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
