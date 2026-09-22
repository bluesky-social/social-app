import {type Client} from '@atproto/lex'

import {type app} from '#/lexicons'
import {MergeFeedAPI} from './merge'

const post = {} as app.bsky.feed.defs.FeedViewPost

describe('MergeFeedAPI', () => {
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
