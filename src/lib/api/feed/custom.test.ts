import {type Client} from '@atproto/lex'

import {CustomFeedAPI} from './custom'

jest.mock('#/state/preferences/languages', () => ({
  getAppLanguageAsContentLanguage: () => '',
  getContentLanguages: () => [],
}))

jest.mock('./utils', () => ({
  createBskyTopicsHeader: () => ({}),
  isBlueskyOwnedFeed: () => false,
}))

describe('CustomFeedAPI', () => {
  it('passes the abort signal to authenticated requests', async () => {
    const call = jest.fn().mockResolvedValue({feed: []})
    const client = {
      did: 'did:plc:test',
      call,
    } as unknown as Client
    const api = new CustomFeedAPI({
      client,
      feedParams: {
        feed: 'at://did:example:feed/app.bsky.feed.generator/test',
      },
    })
    const signal = new AbortController().signal

    await api.fetch({cursor: undefined, limit: 10, signal})

    expect(call).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({signal}),
    )
  })

  it('preserves the cursor from an empty logged-out fallback page', async () => {
    const originalFetch = global.fetch
    const fetchMock: jest.MockedFunction<typeof fetch> = jest
      .fn()
      .mockResolvedValueOnce(Response.json({feed: []}))
      .mockResolvedValueOnce(Response.json({feed: [], cursor: 'next'}))
    global.fetch = fetchMock
    const api = new CustomFeedAPI({
      client: {did: undefined} as unknown as Client,
      feedParams: {
        feed: 'at://did:example:feed/app.bsky.feed.generator/test',
      },
    })

    try {
      await expect(api.fetch({cursor: undefined, limit: 10})).resolves.toEqual({
        cursor: 'next',
        feed: [],
      })
      expect(fetchMock).toHaveBeenCalledTimes(2)
    } finally {
      global.fetch = originalFetch
    }
  })
})
