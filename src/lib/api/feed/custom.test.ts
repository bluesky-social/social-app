import {Platform} from 'react-native'
import {type Client} from '@atproto/lex'

import {DISCOVER_FEED_URI} from '#/lib/constants'
import {CustomFeedAPI as FollowingV2CustomFeedAPI} from '#/features/followingV2/home/api/custom'
import {CustomFeedAPI as LegacyCustomFeedAPI} from './custom'

jest.mock('#/state/preferences/languages', () => ({
  getAppLanguageAsContentLanguage: () => '',
  getContentLanguages: () => [],
}))

jest.mock('#/analytics/identifiers', () => ({
  getDeviceId: () => undefined,
  getSessionId: () => undefined,
}))

jest.mock('#/storage', () => ({
  device: {
    get: jest.fn(([key]) =>
      key === 'geolocationServiceResponse'
        ? {countryCode: 'JP', regionCode: '13', city: '東京', ip: '192.0.2.1'}
        : undefined,
    ),
  },
}))

const fetchMock = jest.spyOn(global, 'fetch')
beforeEach(() => fetchMock.mockReset())
afterAll(() => fetchMock.mockRestore())

const thirdPartyFeed = 'at://did:example:feed/app.bsky.feed.generator/test'
const feedHeaders = {
  'x-atproto-bsky-platform': Platform.OS,
  'x-atproto-bsky-geo-country': 'JP',
  'x-atproto-bsky-geo-region': '13',
  'x-atproto-bsky-geo-city': '%E6%9D%B1%E4%BA%AC',
  'x-atproto-bsky-geo-ip': '192.0.2.1',
}

describe.each([
  ['legacy', LegacyCustomFeedAPI],
  ['following v2', FollowingV2CustomFeedAPI],
] as const)('CustomFeedAPI (%s)', (_name, CustomFeedAPI) => {
  it.each([DISCOVER_FEED_URI, thirdPartyFeed] as const)(
    'gates platform and geolocation headers for authenticated fetches and peeks: %s',
    async feed => {
      const call = jest.fn().mockResolvedValue({feed: []})
      const api = new CustomFeedAPI({
        client: {did: 'did:plc:test', call} as unknown as Client,
        feedParams: {feed},
        userInterests: 'music',
      })

      await api.fetch({cursor: undefined, limit: 10})
      await api.peekLatest()

      const owned = feed === DISCOVER_FEED_URI
      const headers = {
        ...(owned ? feedHeaders : {}),
        'Accept-Language': '',
      }
      expect(call).toHaveBeenNthCalledWith(
        1,
        expect.anything(),
        expect.anything(),
        {
          signal: undefined,
          headers: {
            ...headers,
            ...(owned ? {'x-atproto-bsky-topics': 'music'} : {}),
          },
        },
      )
      expect(call).toHaveBeenNthCalledWith(
        2,
        expect.anything(),
        expect.anything(),
        {headers},
      )
    },
  )

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

  it.each([DISCOVER_FEED_URI, thirdPartyFeed] as const)(
    'preserves the cursor and gates feed headers on both logged-out attempts: %s',
    async feed => {
      fetchMock
        .mockResolvedValueOnce(Response.json({feed: []}))
        .mockResolvedValueOnce(Response.json({feed: [], cursor: 'next'}))
      const api = new CustomFeedAPI({
        client: {did: undefined} as unknown as Client,
        feedParams: {feed},
      })

      await expect(api.fetch({cursor: undefined, limit: 10})).resolves.toEqual({
        cursor: 'next',
        feed: [],
      })
      expect(fetchMock).toHaveBeenCalledTimes(2)
      for (const [, init] of fetchMock.mock.calls) {
        const headers = new Headers(init?.headers)
        for (const [key, value] of Object.entries(feedHeaders)) {
          expect(headers.get(key)).toBe(
            feed === DISCOVER_FEED_URI ? value : null,
          )
        }
      }
    },
  )
})
