import {type AtpAgent} from '@atproto/api'

import {CustomFeedAPI} from './custom'

jest.mock('@atproto/api', () => ({
  AtpAgent: {appLabelers: []},
  jsonStringToLex: (value: string) => JSON.parse(value),
}))

jest.mock('#/state/preferences/languages', () => ({
  getAppLanguageAsContentLanguage: () => '',
  getContentLanguages: () => [],
}))

jest.mock('./utils', () => ({
  createBskyTopicsHeader: () => ({}),
  isBlueskyOwnedFeed: () => false,
}))

describe('CustomFeedAPI', () => {
  it('preserves the cursor from an empty logged-out fallback page', async () => {
    const originalFetch = global.fetch
    const fetchMock: jest.MockedFunction<typeof fetch> = jest
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({feed: []})))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({feed: [], cursor: 'next'})),
      )
    global.fetch = fetchMock
    const api = new CustomFeedAPI({
      agent: {did: undefined} as unknown as AtpAgent,
      feedParams: {feed: 'at://did:example:feed/app.bsky.feed.generator/test'},
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
