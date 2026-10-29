import {type Client} from '@atproto/lex'

import {app} from '#/lexicons'
import {MergeFeedAPI} from './merge'

const post = {} as app.bsky.feed.defs.FeedViewPost

describe('MergeFeedAPI', () => {
  it('rebinds every source without resetting its pagination state', async () => {
    const oldCall = jest.fn().mockRejectedValue(new Error('session disposed'))
    const newCall = jest
      .fn()
      .mockResolvedValue({feed: [], cursor: 'following-next'})
    const api = new MergeFeedAPI({
      client: {call: oldCall} as unknown as Client,
      feedParams: {
        mergeFeedEnabled: true,
        mergeFeedSources: [
          'at://did:example:feed/app.bsky.feed.generator/test',
        ],
      },
      feedTuners: [],
    })
    api.reset()
    api.following.cursor = 'following-cursor'
    api.feedCursor = 1
    api.itemCursor = 7
    const following = api.following
    const customFeed = api.customFeeds[0]
    customFeed.cursor = 'custom-cursor'
    customFeed.queue = [post]

    const client = {call: newCall} as unknown as Client
    api.setClient(client)

    expect(api.following).toBe(following)
    expect(api.customFeeds[0]).toBe(customFeed)
    expect(customFeed.client).toBe(client)
    expect(customFeed.cursor).toBe('custom-cursor')
    expect(customFeed.queue).toHaveLength(1)
    expect(api.feedCursor).toBe(1)
    expect(api.itemCursor).toBe(7)
    await api.fetch({cursor: 'started', limit: 1})
    expect(newCall).toHaveBeenCalledWith(
      app.bsky.feed.getTimeline,
      expect.objectContaining({cursor: 'following-cursor'}),
    )
    expect(oldCall).not.toHaveBeenCalled()
  })

  it('does not let a pending old-client request exhaust a custom source', async () => {
    let rejectOld!: (error: Error) => void
    const oldCall = jest.fn(
      () =>
        new Promise<never>((_resolve, reject) => {
          rejectOld = reject
        }),
    )
    const newCall = jest.fn().mockResolvedValue({feed: [], cursor: 'new'})
    const api = new MergeFeedAPI({
      client: {call: oldCall} as unknown as Client,
      feedParams: {
        mergeFeedSources: [
          'at://did:example:feed/app.bsky.feed.generator/test',
        ],
      },
      feedTuners: [],
    })
    api.reset()
    const source = api.customFeeds[0]
    const pending = source.fetchNext(10)

    api.setClient({call: newCall} as unknown as Client)
    await source.fetchNext(10)
    rejectOld(new Error('session disposed'))
    await pending

    expect(newCall).toHaveBeenCalledTimes(1)
    expect(source.cursor).toBe('new')
    expect(source.hasMore).toBe(true)
  })

  it('retries a custom source that failed before the client was replaced', async () => {
    const oldCall = jest.fn().mockRejectedValue(new Error('session disposed'))
    const newCall = jest.fn().mockResolvedValue({feed: [], cursor: 'new'})
    const api = new MergeFeedAPI({
      client: {call: oldCall} as unknown as Client,
      feedParams: {
        mergeFeedSources: [
          'at://did:example:feed/app.bsky.feed.generator/test',
        ],
      },
      feedTuners: [],
    })
    api.reset()
    const source = api.customFeeds[0]
    await source.fetchNext(10)
    expect(source.hasMore).toBe(false)

    api.setClient({call: newCall} as unknown as Client)
    await source.fetchNext(10)

    expect(source.cursor).toBe('new')
    expect(source.hasMore).toBe(true)
  })

  it('does not tune a late following response from the old client', async () => {
    let resolveOld!: (page: {feed: (typeof post)[]; cursor: string}) => void
    const oldCall = jest.fn(
      () =>
        new Promise<{feed: (typeof post)[]; cursor: string}>(resolve => {
          resolveOld = resolve
        }),
    )
    const newCall = jest.fn().mockResolvedValue({feed: [], cursor: 'new'})
    const api = new MergeFeedAPI({
      client: {call: oldCall} as unknown as Client,
      feedParams: {},
      feedTuners: [],
    })
    const pending = api.following.fetchNext(10)

    api.setClient({call: newCall} as unknown as Client)
    await api.following.fetchNext(10)
    resolveOld({feed: [post], cursor: 'old'})
    await pending

    expect(newCall).toHaveBeenCalledTimes(1)
    expect(api.following.cursor).toBe('new')
    expect(api.following.hasMore).toBe(true)
    expect(api.following.queue).toHaveLength(0)
  })

  it('does not tune a stale response if the client identity returns', async () => {
    let resolveOld!: (page: {feed: (typeof post)[]; cursor: string}) => void
    const call = jest
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<{feed: (typeof post)[]; cursor: string}>(resolve => {
            resolveOld = resolve
          }),
      )
      .mockResolvedValue({feed: [], cursor: 'new'})
    const client = {call} as unknown as Client
    const api = new MergeFeedAPI({
      client,
      feedParams: {},
      feedTuners: [],
    })
    const pending = api.following.fetchNext(10)

    api.setClient({call: jest.fn()} as unknown as Client)
    api.setClient(client)
    await api.following.fetchNext(10)
    resolveOld({feed: [post], cursor: 'old'})
    await pending

    expect(call).toHaveBeenCalledTimes(2)
    expect(api.following.cursor).toBe('new')
    expect(api.following.queue).toHaveLength(0)
  })

  it('drains a terminal following queue without restarting the source', async () => {
    const api = new MergeFeedAPI({
      client: {} as Client,
      feedParams: {},
      feedTuners: [],
    })
    api.reset()
    api.following.queue = [post, post, post]
    api.following.hasMore = false

    const first = await api.fetch({cursor: 'started', limit: 2})
    const second = await api.fetch({cursor: first.cursor, limit: 2})

    expect(first.feed).toHaveLength(2)
    expect(first.cursor).toBeDefined()
    expect(second.feed).toHaveLength(1)
    expect(second.cursor).toBeUndefined()
  })

  it('stops when the following source repeats its cursor', async () => {
    const call = jest
      .fn()
      .mockResolvedValueOnce({feed: [], cursor: 'a'})
      .mockResolvedValueOnce({feed: [], cursor: 'a'})
    const api = new MergeFeedAPI({
      client: {call} as unknown as Client,
      feedParams: {},
      feedTuners: [],
    })

    const first = await api.fetch({cursor: undefined, limit: 1})
    const second = await api.fetch({cursor: first.cursor, limit: 1})

    expect(first.cursor).toBeDefined()
    expect(second.cursor).toBeUndefined()
    expect(call).toHaveBeenCalledTimes(2)
  })

  it('stops when the following source returns an empty cursor', async () => {
    const call = jest.fn().mockResolvedValue({feed: [], cursor: ''})
    const api = new MergeFeedAPI({
      client: {call} as unknown as Client,
      feedParams: {},
      feedTuners: [],
    })

    const result = await api.fetch({cursor: undefined, limit: 1})

    expect(result.cursor).toBeUndefined()
    expect(call).toHaveBeenCalledTimes(1)
  })

  it('stops when the following source cycles to an earlier cursor', async () => {
    const call = jest
      .fn()
      .mockResolvedValueOnce({feed: [], cursor: 'a'})
      .mockResolvedValueOnce({feed: [], cursor: 'b'})
      .mockResolvedValueOnce({feed: [], cursor: 'a'})
    const api = new MergeFeedAPI({
      client: {call} as unknown as Client,
      feedParams: {},
      feedTuners: [],
    })

    const first = await api.fetch({cursor: undefined, limit: 1})
    const second = await api.fetch({cursor: first.cursor, limit: 1})
    const third = await api.fetch({cursor: second.cursor, limit: 1})

    expect(third.cursor).toBeUndefined()
    expect(call).toHaveBeenCalledTimes(3)
  })

  it('drains a terminal custom-feed queue without restarting the source', async () => {
    const call = jest.fn()
    const api = new MergeFeedAPI({
      client: {call} as unknown as Client,
      feedParams: {
        mergeFeedEnabled: true,
        mergeFeedSources: [
          'at://did:example:feed/app.bsky.feed.generator/test',
        ],
      },
      feedTuners: [],
    })
    api.reset()
    api.following.hasMore = false
    api.customFeeds[0].queue = [post, post, post]
    api.customFeeds[0].hasMore = false

    const first = await api.fetch({cursor: 'started', limit: 2})
    const second = await api.fetch({cursor: first.cursor, limit: 2})

    expect(first.feed).toHaveLength(2)
    expect(second.feed).toHaveLength(1)
    expect(second.cursor).toBeUndefined()
    expect(call).not.toHaveBeenCalled()
  })
})
