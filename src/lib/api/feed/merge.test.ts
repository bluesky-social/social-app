import {type AppBskyFeedDefs, type AtpAgent} from '@atproto/api'

import {MergeFeedAPI} from './merge'

const post = {} as AppBskyFeedDefs.FeedViewPost

describe('MergeFeedAPI', () => {
  it('drains a terminal following queue without restarting the source', async () => {
    const api = new MergeFeedAPI({
      agent: {} as AtpAgent,
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
    const getTimeline = jest
      .fn()
      .mockResolvedValueOnce({
        success: true,
        headers: {},
        data: {feed: [], cursor: 'a'},
      })
      .mockResolvedValueOnce({
        success: true,
        headers: {},
        data: {feed: [], cursor: 'a'},
      })
    const api = new MergeFeedAPI({
      agent: {getTimeline} as unknown as AtpAgent,
      feedParams: {},
      feedTuners: [],
    })

    const first = await api.fetch({cursor: undefined, limit: 1})
    const second = await api.fetch({cursor: first.cursor, limit: 1})

    expect(first.cursor).toBeDefined()
    expect(second.cursor).toBeUndefined()
    expect(getTimeline).toHaveBeenCalledTimes(2)
  })

  it('stops when the following source returns an empty cursor', async () => {
    const getTimeline = jest.fn().mockResolvedValue({
      success: true,
      headers: {},
      data: {feed: [], cursor: ''},
    })
    const api = new MergeFeedAPI({
      agent: {getTimeline} as unknown as AtpAgent,
      feedParams: {},
      feedTuners: [],
    })

    const result = await api.fetch({cursor: undefined, limit: 1})

    expect(result.cursor).toBeUndefined()
    expect(getTimeline).toHaveBeenCalledTimes(1)
  })

  it('stops when the following source cycles to an earlier cursor', async () => {
    const getTimeline = jest
      .fn()
      .mockResolvedValueOnce({
        success: true,
        headers: {},
        data: {feed: [], cursor: 'a'},
      })
      .mockResolvedValueOnce({
        success: true,
        headers: {},
        data: {feed: [], cursor: 'b'},
      })
      .mockResolvedValueOnce({
        success: true,
        headers: {},
        data: {feed: [], cursor: 'a'},
      })
    const api = new MergeFeedAPI({
      agent: {getTimeline} as unknown as AtpAgent,
      feedParams: {},
      feedTuners: [],
    })

    const first = await api.fetch({cursor: undefined, limit: 1})
    const second = await api.fetch({cursor: first.cursor, limit: 1})
    const third = await api.fetch({cursor: second.cursor, limit: 1})

    expect(third.cursor).toBeUndefined()
    expect(getTimeline).toHaveBeenCalledTimes(3)
  })

  it('drains a terminal custom-feed queue without restarting the source', async () => {
    const getFeed = jest.fn()
    const api = new MergeFeedAPI({
      agent: {
        app: {bsky: {feed: {getFeed}}},
      } as unknown as AtpAgent,
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
    expect(getFeed).not.toHaveBeenCalled()
  })
})
