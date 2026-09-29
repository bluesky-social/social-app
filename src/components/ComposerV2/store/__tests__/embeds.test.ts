import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from '@jest/globals'

/* Avoid loading the UI module chain through the real link resolver. */
jest.mock('#/lib/api/resolve', () => {
  class EmbeddingDisabledError extends Error {}
  return {resolveLink: jest.fn(), EmbeddingDisabledError}
})

import {
  EmbeddingDisabledError,
  type LinkResolvers,
  type ResolvedLink,
  type resolveLink,
} from '#/lib/api/resolve'
import {createThreadStore} from '#/components/ComposerV2/store'
import {testUploadRuntime} from '#/components/ComposerV2/store/__tests__/uploadTestUtils'
import {type AddMediaInput} from '#/components/ComposerV2/store/types'
import {classifyUriTarget} from '#/components/ComposerV2/store/utils/classifyUriTarget'
import {type Gif} from '#/features/gifPicker/types'
import {type app} from '#/lexicons'

const POST_URL = 'https://bsky.app/profile/test.bsky.social/post/abc'
const FEED_URL = 'https://bsky.app/profile/test.bsky.social/feed/abc'
const LIST_URL = 'https://bsky.app/profile/test.bsky.social/lists/abc'
const STARTER_PACK_URL = 'https://bsky.app/starter-pack/test.bsky.social/abc'
const EXTERNAL_URL = 'https://example.com'
const INVITE_URL = 'https://bsky.app/chat/abc1234'

const postLink: Extract<ResolvedLink, {type: 'record'; kind: 'post'}> = {
  type: 'record',
  kind: 'post',
  record: {uri: 'at://did:plc:example/app.bsky.feed.post/abc', cid: 'cp'},
  view: {
    uri: 'at://did:plc:example/app.bsky.feed.post/abc',
    cid: 'cp',
  } as unknown as app.bsky.feed.defs.PostView,
}
const feedLink: Extract<ResolvedLink, {type: 'record'; kind: 'feed'}> = {
  type: 'record',
  kind: 'feed',
  record: {uri: 'at://did:plc:example/app.bsky.feed.generator/abc', cid: 'cf'},
  view: {
    uri: 'at://did:plc:example/app.bsky.feed.generator/abc',
    cid: 'cf',
  } as unknown as app.bsky.feed.defs.GeneratorView,
}
const listLink: Extract<ResolvedLink, {type: 'record'; kind: 'list'}> = {
  type: 'record',
  kind: 'list',
  record: {uri: 'at://did:plc:example/app.bsky.graph.list/abc', cid: 'cl'},
  view: {
    uri: 'at://did:plc:example/app.bsky.graph.list/abc',
    cid: 'cl',
  } as unknown as app.bsky.graph.defs.ListView,
}
const starterPackLink: Extract<
  ResolvedLink,
  {type: 'record'; kind: 'starter-pack'}
> = {
  type: 'record',
  kind: 'starter-pack',
  record: {
    uri: 'at://did:plc:example/app.bsky.graph.starterpack/abc',
    cid: 'cs',
  },
  view: {
    uri: 'at://did:plc:example/app.bsky.graph.starterpack/abc',
    cid: 'cs',
  } as unknown as app.bsky.graph.defs.StarterPackView,
}
const externalLink: Extract<ResolvedLink, {type: 'external'}> = {
  type: 'external',
  uri: EXTERNAL_URL,
  title: 'Example',
  description: 'A description',
  thumb: undefined,
  associatedRefs: [postLink.record],
}
const chatInviteLink: Extract<ResolvedLink, {type: 'chat-invite'}> = {
  type: 'chat-invite',
  uri: INVITE_URL,
  code: 'abc1234',
  view: undefined,
}
const records = [
  {uri: POST_URL, link: postLink},
  {uri: FEED_URL, link: feedLink},
  {uri: LIST_URL, link: listLink},
  {uri: STARTER_PACK_URL, link: starterPackLink},
]
const cards = [
  {uri: EXTERNAL_URL, link: externalLink},
  {uri: INVITE_URL, link: chatInviteLink},
]
const uploads: AddMediaInput[] = [
  {kind: 'image', uri: 'file:///a.jpg', width: 10, height: 10},
  {
    kind: 'video',
    uri: 'file:///a.mp4',
    width: 10,
    height: 10,
    mimeType: 'video/mp4',
  },
  {kind: 'gif', gif: {url: 'https://example.com/g.gif'} as Gif},
]
const slots = [
  {slot: 'record' as const, uri: POST_URL, link: postLink},
  {slot: 'media' as const, uri: EXTERNAL_URL, link: externalLink},
]
const resolvers = {} as LinkResolvers
let mockResolveLink: jest.Mock<typeof resolveLink>

beforeEach(() => {
  jest.useFakeTimers()
  mockResolveLink = jest.fn<typeof resolveLink>()
})
afterEach(() => {
  jest.clearAllTimers()
  jest.useRealTimers()
})

function makeStore() {
  let i = 0
  return createThreadStore({
    ...testUploadRuntime,
    resolvers,
    __createId: () => `id-${++i}`,
    __resolveLink: mockResolveLink,
  })
}

function rootId(store: ReturnType<typeof createThreadStore>) {
  return Object.keys(store.getState().posts)[0]
}

function deferred() {
  let resolve!: (value: ResolvedLink) => void
  let reject!: (err: unknown) => void
  const promise = new Promise<ResolvedLink>((res, rej) => {
    resolve = res
    reject = rej
  })
  return {promise, resolve, reject}
}

function removeSlot(
  store: ReturnType<typeof createThreadStore>,
  postId: string,
  slot: 'record' | 'media',
) {
  if (slot === 'record') store.actions.removeRecordAttachment(postId)
  else store.actions.removeMediaAttachment(postId)
}

function setPostRecord(
  store: ReturnType<typeof createThreadStore>,
  postId: string,
) {
  store.actions.setRecordAttachment(postId, {
    kind: 'post',
    record: postLink.record,
    view: postLink.view,
  })
}

describe('record and media routing', () => {
  test.each(records)(
    '$link.kind reserves and resolves the record slot',
    async ({uri, link}) => {
      const d = deferred()
      mockResolveLink.mockReturnValue(d.promise)
      const store = makeStore()
      const root = rootId(store)
      store.actions.addUri(root, uri)
      expect(mockResolveLink).toHaveBeenCalledWith(resolvers, uri)
      expect(store.getState().posts[root].attachments).toEqual({
        record: {state: 'pending', uri},
        media: undefined,
      })
      expect(store.getState().posts[root].imageSelectionsRemaining).toBe(10)
      expect(
        store.actions.addMedia(root, [uploads[0]])?.addedMediaIds,
      ).toHaveLength(1)
      d.resolve(link)
      await d.promise
      expect(store.getState().posts[root].attachments.record).toEqual({
        state: 'resolved',
        kind: link.kind,
        record: link.record,
        view: link.view,
      })
    },
  )

  test('legacy starter-pack URLs also target the record slot', () => {
    expect(
      classifyUriTarget({uri: 'https://bsky.app/start/test.bsky.social/abc'}),
    ).toBe('record')
  })

  test.each(cards)(
    '$link.type reserves and resolves the media slot',
    async ({uri, link}) => {
      mockResolveLink.mockResolvedValue(link)
      const store = makeStore()
      const root = rootId(store)
      store.actions.addUri(root, uri)
      expect(store.getState().posts[root].attachments.media).toEqual({
        state: 'pending',
        uri,
      })
      expect(store.getState().posts[root].imageSelectionsRemaining).toBe(0)
      await Promise.resolve()
      const {type: kind, ...value} = link
      expect(store.getState().posts[root].attachments.media).toEqual({
        state: 'resolved',
        kind,
        ...value,
      })
      expect(store.getState().posts[root].attachments.record).toBeUndefined()
    },
  )

  test('resolves concurrent record and media candidates independently', async () => {
    const recordPending = deferred()
    const mediaPending = deferred()
    mockResolveLink
      .mockReturnValueOnce(recordPending.promise)
      .mockReturnValueOnce(mediaPending.promise)
    const store = makeStore()
    const root = rootId(store)

    store.actions.addUri(root, POST_URL)
    store.actions.addUri(root, EXTERNAL_URL)
    expect(store.getState().posts[root].attachments).toEqual({
      record: {state: 'pending', uri: POST_URL},
      media: {state: 'pending', uri: EXTERNAL_URL},
    })
    expect(store.getState().posts[root].imageSelectionsRemaining).toBe(0)

    mediaPending.resolve(externalLink)
    await mediaPending.promise
    expect(store.getState().posts[root].attachments.record).toEqual({
      state: 'pending',
      uri: POST_URL,
    })
    expect(store.getState().posts[root].attachments.media).toMatchObject({
      state: 'resolved',
      kind: 'external',
    })

    recordPending.resolve(postLink)
    await recordPending.promise
    expect(store.getState().posts[root].attachments.record).toMatchObject({
      state: 'resolved',
      kind: 'post',
    })
  })
})

describe.each(records)('$link.kind coexists with media', ({uri, link}) => {
  test.each(uploads)('$kind before and after the record', async input => {
    for (const recordFirst of [false, true]) {
      mockResolveLink.mockResolvedValue(link)
      const store = makeStore()
      const root = rootId(store)
      if (recordFirst) {
        store.actions.addUri(root, uri)
        await Promise.resolve()
      }
      expect(store.actions.addMedia(root, [input])?.addedMediaIds).toHaveLength(
        1,
      )
      if (!recordFirst) store.actions.addUri(root, uri)
      await Promise.resolve()
      const {record, media} = store.getState().posts[root].attachments
      expect(record).toMatchObject({state: 'resolved', kind: link.kind})
      expect(media).toMatchObject({
        state: 'resolved',
        kind: input.kind === 'image' ? 'images' : input.kind,
      })
      jest.runAllTimers()
      expect(store.getState().posts[root].attachments.record).toBe(record)
      store.actions.removeRecordAttachment(root)
      expect(store.getState().posts[root].attachments.media).toBeDefined()
      store.destroy()
    }
  })

  test.each(cards)('$link.type before and after the record', async card => {
    for (const recordFirst of [false, true]) {
      mockResolveLink.mockImplementation((_clients, url) =>
        Promise.resolve(url === uri ? link : card.link),
      )
      const store = makeStore()
      const root = rootId(store)
      const uris = recordFirst ? [uri, card.uri] : [card.uri, uri]
      for (const url of uris) {
        store.actions.addUri(root, url)
        await Promise.resolve()
      }
      const {record, media} = store.getState().posts[root].attachments
      expect(record).toMatchObject({state: 'resolved', kind: link.kind})
      expect(media).toMatchObject({state: 'resolved', kind: card.link.type})
      store.actions.removeMediaAttachment(root)
      expect(store.getState().posts[root].attachments.record).toBe(record)
    }
  })
})

describe('slot collisions', () => {
  test.each(records)(
    '$link.kind excludes every other settled record candidate',
    async ({uri, link}) => {
      mockResolveLink.mockResolvedValue(link)
      const store = makeStore()
      const root = rootId(store)
      store.actions.addUri(root, uri)
      await Promise.resolve()
      const before = store.getState()
      for (const candidate of records) store.actions.addUri(root, candidate.uri)
      expect(store.getState()).toBe(before)
      expect(mockResolveLink).toHaveBeenCalledTimes(1)
    },
  )

  test.each(cards)(
    '$link.type excludes uploaded media and other cards',
    async ({uri, link}) => {
      mockResolveLink.mockResolvedValue(link)
      const store = makeStore()
      const root = rootId(store)
      store.actions.addUri(root, uri)
      await Promise.resolve()
      const before = store.getState()
      for (const input of uploads)
        expect(store.actions.addMedia(root, [input])).toEqual({
          addedMediaIds: [],
        })
      for (const card of cards) store.actions.addUri(root, card.uri)
      expect(store.getState()).toBe(before)
      expect(mockResolveLink).toHaveBeenCalledTimes(1)
    },
  )

  test.each(uploads)('$kind excludes both external card kinds', input => {
    const store = makeStore()
    const root = rootId(store)
    store.actions.addMedia(root, [input])
    const before = store.getState()
    for (const card of cards) store.actions.addUri(root, card.uri)
    expect(store.getState()).toBe(before)
    expect(mockResolveLink).not.toHaveBeenCalled()
  })
})

describe.each(slots)('$slot resolution lifecycle', ({slot, uri, link}) => {
  test('retryable failure carries a bound retry and reserves the slot', async () => {
    mockResolveLink
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(link)
    const store = makeStore()
    const root = rootId(store)
    store.actions.addUri(root, uri)
    await Promise.resolve()
    const failed = store.getState().posts[root].attachments[slot]
    if (failed?.state !== 'failed') throw new Error('expected failed')
    expect(failed.code).toBe('unknown')
    expect(failed.error).toBe('Link resolution failed')
    expect(failed.retry).toEqual(expect.any(Function))
    expect(store.getState().posts[root].imageSelectionsRemaining).toBe(
      slot === 'media' ? 0 : 10,
    )
    if (slot === 'media')
      expect(store.actions.addMedia(root, [uploads[0]])).toEqual({
        addedMediaIds: [],
      })
    failed.retry?.()
    expect(store.getState().posts[root].attachments[slot]?.state).toBe(
      'pending',
    )
    await Promise.resolve()
    expect(store.getState().posts[root].attachments[slot]?.state).toBe(
      'resolved',
    )
  })

  test('new pending candidates supersede old successes and failures', async () => {
    for (const oldFails of [false, true]) {
      const first = deferred()
      const second = deferred()
      mockResolveLink
        .mockReturnValueOnce(first.promise)
        .mockReturnValueOnce(second.promise)
      const store = makeStore()
      const root = rootId(store)
      store.actions.addUri(root, uri)
      store.actions.addUri(root, `${uri}?new`)
      second.resolve(link)
      await second.promise
      const before = store.getState()
      if (oldFails) first.reject(new Error('old failure'))
      else first.resolve(link)
      await first.promise.catch(() => {})
      expect(store.getState()).toBe(before)
    }
  })

  test('a stale retry cannot replace a newer candidate', async () => {
    mockResolveLink
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(link)
    const store = makeStore()
    const root = rootId(store)
    store.actions.addUri(root, uri)
    await Promise.resolve()
    const failed = store.getState().posts[root].attachments[slot]
    if (failed?.state !== 'failed') throw new Error('expected failed')

    store.actions.addUri(root, `${uri}?new`)
    expect(mockResolveLink).toHaveBeenCalledTimes(2)
    failed.retry?.()
    expect(mockResolveLink).toHaveBeenCalledTimes(2)
    await Promise.resolve()
    expect(store.getState().posts[root].attachments[slot]).toMatchObject({
      state: 'resolved',
      kind: slot === 'record' ? link.kind : link.type,
    })
  })

  test('removal prevents a stale response from reviving the attachment', async () => {
    const d = deferred()
    mockResolveLink.mockReturnValue(d.promise)
    const store = makeStore()
    const root = rootId(store)
    store.actions.addUri(root, uri)
    removeSlot(store, root, slot)
    const before = store.getState()
    d.resolve(link)
    await d.promise
    expect(store.getState()).toBe(before)
    expect(before.posts[root].attachments[slot]).toBeUndefined()
  })

  test('removing the other slot does not cancel this resolution', async () => {
    mockResolveLink.mockImplementation((_clients, url) =>
      Promise.resolve(url === POST_URL ? postLink : externalLink),
    )
    const store = makeStore()
    const root = rootId(store)
    store.actions.addUri(root, POST_URL)
    store.actions.addUri(root, EXTERNAL_URL)
    removeSlot(store, root, slot === 'record' ? 'media' : 'record')
    await Promise.resolve()
    expect(store.getState().posts[root].attachments[slot]?.state).toBe(
      'resolved',
    )
  })

  test('a retry retained from removed state cannot restore it', async () => {
    mockResolveLink.mockRejectedValue(new Error('network down'))
    const store = makeStore()
    const root = rootId(store)
    store.actions.addUri(root, uri)
    await Promise.resolve()
    const failed = store.getState().posts[root].attachments[slot]
    if (failed?.state !== 'failed') throw new Error('expected failed')
    removeSlot(store, root, slot)
    const before = store.getState()
    failed.retry?.()
    expect(store.getState()).toBe(before)
    expect(mockResolveLink).toHaveBeenCalledTimes(1)
  })

  test('a mismatched result fails in its original slot without overwriting the other', async () => {
    mockResolveLink.mockResolvedValue(
      slot === 'record' ? externalLink : feedLink,
    )
    const store = makeStore()
    const root = rootId(store)
    if (slot === 'record') store.actions.addMedia(root, [uploads[0]])
    else setPostRecord(store, root)
    const other = slot === 'record' ? 'media' : 'record'
    const previous = store.getState().posts[root].attachments[other]
    store.actions.addUri(root, uri)
    await Promise.resolve()
    expect(store.getState().posts[root].attachments[slot]?.state).toBe('failed')
    expect(store.getState().posts[root].attachments[other]).toBe(previous)
  })

  test('post removal and destroy discard pending responses', async () => {
    for (const destroy of [false, true]) {
      const d = deferred()
      mockResolveLink.mockReturnValue(d.promise)
      const store = makeStore()
      const postId = store.actions.addPost('after', rootId(store))!.addedPostId
      store.actions.addUri(postId, uri)
      if (destroy) store.destroy()
      else store.actions.removePost(postId)
      const before = store.getState()
      d.resolve(link)
      await d.promise
      expect(store.getState()).toBe(before)
    }
  })
})

describe('direct record insertion', () => {
  test('replaces a pending record without disturbing media', async () => {
    const d = deferred()
    mockResolveLink.mockReturnValue(d.promise)
    const store = makeStore()
    const root = rootId(store)
    store.actions.addMedia(root, [uploads[0]])
    const media = store.getState().posts[root].attachments.media
    store.actions.addUri(root, FEED_URL)
    setPostRecord(store, root)
    const before = store.getState()
    expect(before.isDirty).toBe(true)
    expect(before.posts[root].attachments.record).toMatchObject({
      state: 'resolved',
      kind: 'post',
    })
    expect(before.posts[root].attachments.media).toBe(media)
    d.resolve(feedLink)
    await d.promise
    expect(store.getState()).toBe(before)
  })

  test.each(records)('supports hydrated $link.kind and removal', ({link}) => {
    const store = makeStore()
    const root = rootId(store)
    const {type: _type, ...value} = link
    store.actions.setRecordAttachment(root, value)
    expect(store.getState().posts[root].attachments.record).toEqual({
      state: 'resolved',
      ...value,
    })
    store.actions.removeRecordAttachment(root)
    expect(store.getState().posts[root].attachments.record).toBeUndefined()
  })

  test('embedding-disabled is a non-retryable record failure', async () => {
    mockResolveLink.mockRejectedValue(new EmbeddingDisabledError())
    const store = makeStore()
    const root = rootId(store)
    store.actions.addUri(root, POST_URL)
    await Promise.resolve()
    const failed = store.getState().posts[root].attachments.record
    expect(failed).toMatchObject({state: 'failed', code: 'embedding-disabled'})
    if (failed?.state !== 'failed') throw new Error('expected failed')
    expect(failed.retry).toBeUndefined()
  })
})
