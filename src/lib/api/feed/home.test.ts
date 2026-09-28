import {type Client} from '@atproto/lex'

import {FollowingFeedAPI} from './following'
import {FALLBACK_MARKER_POST, HomeFeedAPI} from './home'

jest.mock('#/state/preferences/languages', () => ({
  getAppLanguageAsContentLanguage: () => '',
  getContentLanguages: () => [],
}))

jest.mock('./utils', () => ({
  createBskyTopicsHeader: () => ({}),
  isBlueskyOwnedFeed: () => false,
}))

const post = {post: {uri: 'at://did:plc:a/app.bsky.feed.post/1'}}

function clientReturning(...responses: object[]) {
  const call = jest.fn()
  for (const response of responses) {
    call.mockResolvedValueOnce(response)
  }
  return {did: 'did:plc:viewer', call} as unknown as Client
}

describe('startCursor', () => {
  it('is passed through by the Following feed', async () => {
    const api = new FollowingFeedAPI({
      client: clientReturning({feed: [post], cursor: 'c1', startCursor: 's1'}),
    })

    await expect(api.fetch({cursor: undefined, limit: 30})).resolves.toEqual({
      cursor: 'c1',
      startCursor: 's1',
      feed: [post],
    })
  })

  it('is passed through by the Home feed while it shows Following', async () => {
    const api = new HomeFeedAPI({
      client: clientReturning({feed: [post], cursor: 'c1', startCursor: 's1'}),
    })

    await expect(api.fetch({cursor: undefined, limit: 30})).resolves.toEqual({
      cursor: 'c1',
      startCursor: 's1',
      feed: [post],
    })
  })

  it('is absent from Home feed pages that have fallen back to Discover', async () => {
    const api = new HomeFeedAPI({
      client: clientReturning({feed: [post], startCursor: 's1'}),
    })
    // Following runs out, so the rest of the feed is Discover.
    await api.fetch({cursor: 'c0', limit: 30})

    const discoverPage = await api.fetch({cursor: 'd1', limit: 30})
    expect(discoverPage.startCursor).toBeUndefined()
  })

  it('keeps the Following start of the page on which the fallback begins', async () => {
    const api = new HomeFeedAPI({
      client: clientReturning({feed: [post], startCursor: 's1'}),
    })

    const page = await api.fetch({cursor: undefined, limit: 30})
    expect(page.startCursor).toBe('s1')
    expect(page.feed).toContain(FALLBACK_MARKER_POST)
  })
})

describe('since', () => {
  it('is forwarded to getTimeline by the Following and Home feeds', async () => {
    const response = {feed: [post], cursor: 'S', startCursor: 'n1'}
    const following = clientReturning(response)
    const home = clientReturning(response)

    await new FollowingFeedAPI({client: following}).fetch({
      cursor: undefined,
      since: 'S',
      limit: 60,
    })
    await new HomeFeedAPI({client: home}).fetch({
      cursor: undefined,
      since: 'S',
      limit: 60,
    })

    for (const client of [following, home]) {
      expect(jest.mocked(client.call)).toHaveBeenCalledWith(expect.anything(), {
        cursor: undefined,
        since: 'S',
        limit: 60,
      })
    }
  })

  it('is left out of an ordinary request', async () => {
    const client = clientReturning({feed: [post], cursor: 'c1'})
    await new FollowingFeedAPI({client}).fetch({cursor: 'c0', limit: 30})
    expect(jest.mocked(client.call)).toHaveBeenCalledWith(expect.anything(), {
      cursor: 'c0',
      limit: 30,
    })
  })

  it('does not fall back to Discover when a bounded range comes back without a cursor', async () => {
    const api = new HomeFeedAPI({client: clientReturning({feed: [post]})})

    const page = await api.fetch({cursor: undefined, since: 'S', limit: 60})

    expect(page.feed).not.toContain(FALLBACK_MARKER_POST)
    expect(api.usingDiscover).toBe(false)
  })
})
