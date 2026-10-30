import {Platform} from 'react-native'
import {afterEach, beforeEach, describe, expect, it, jest} from '@jest/globals'

import {BSKY_FEED_OWNER_DIDS, DISCOVER_FEED_URI} from '#/lib/constants'
import {type UsePreferencesQueryResponse} from '#/state/queries/preferences'
import {device} from '#/storage'

jest.mock('#/env', () => ({IS_WEB: false}))
jest.mock('#/storage', () => ({device: {get: jest.fn()}}))

import {
  aggregateUserInterests,
  createBskyFeedHeaders,
  createBskyTopicsHeader,
} from '../utils'

beforeEach(() => {
  jest.mocked(device.get).mockReset()
  jest.replaceProperty(Platform, 'OS', 'ios')
})
afterEach(() => {
  jest.restoreAllMocks()
})

describe('createBskyFeedHeaders', () => {
  it.each(['web', 'ios', 'android'] as const)(
    'sends the %s platform even without geolocation data',
    platform => {
      jest.replaceProperty(Platform, 'OS', platform)
      expect(createBskyFeedHeaders(DISCOVER_FEED_URI)).toEqual({
        'x-atproto-bsky-platform': platform,
      })
    },
  )

  it.each(BSKY_FEED_OWNER_DIDS)(
    'sends service data to feeds owned by %s and encodes the city',
    did => {
      jest.mocked(device.get).mockReturnValue({
        countryCode: 'JP',
        regionCode: '13',
        city: '東京',
        ip: '2001:db8::1',
      })

      expect(
        createBskyFeedHeaders(`at://${did}/app.bsky.feed.generator/test`),
      ).toEqual({
        'x-atproto-bsky-platform': 'ios',
        'x-atproto-bsky-geo-country': 'JP',
        'x-atproto-bsky-geo-region': '13',
        'x-atproto-bsky-geo-city': '%E6%9D%B1%E4%BA%AC',
        'x-atproto-bsky-geo-ip': '2001:db8::1',
      })
      expect(device.get).toHaveBeenCalledTimes(1)
      expect(device.get).toHaveBeenCalledWith(['geolocationServiceResponse'])
    },
  )

  it('does not send platform or read location for third-party feeds', () => {
    expect(
      createBskyFeedHeaders(
        'at://did:example:feed/app.bsky.feed.generator/test',
      ),
    ).toEqual({})
    expect(device.get).not.toHaveBeenCalled()
  })

  it('omits missing values and reads updated service data on each request', () => {
    const get = jest.mocked(device.get)
    get.mockReturnValueOnce(undefined)
    expect(createBskyFeedHeaders(DISCOVER_FEED_URI)).toEqual({
      'x-atproto-bsky-platform': 'ios',
    })

    get.mockReturnValueOnce({countryCode: 'US', regionCode: undefined})
    expect(createBskyFeedHeaders(DISCOVER_FEED_URI)).toEqual({
      'x-atproto-bsky-platform': 'ios',
      'x-atproto-bsky-geo-country': 'US',
    })

    get.mockReturnValueOnce({countryCode: '', regionCode: '', city: '', ip: ''})
    expect(createBskyFeedHeaders(DISCOVER_FEED_URI)).toEqual({
      'x-atproto-bsky-platform': 'ios',
    })
  })
})

function preferences(
  interests: Pick<
    UsePreferencesQueryResponse['interests'],
    'tags' | 'updatedAt'
  >,
) {
  return {interests} as UsePreferencesQueryResponse
}

describe('aggregateUserInterests', () => {
  it('appends the update timestamp after a semicolon', () => {
    expect(
      createBskyTopicsHeader(
        aggregateUserInterests(
          preferences({
            tags: ['animals', 'music'],
            updatedAt: '2026-09-03T17:00:00.000Z',
          }),
        ),
      ),
    ).toEqual({
      'x-atproto-bsky-topics': 'animals,music;2026-09-03T17:00:00.000Z',
    })
  })

  it('supports interests created before update timestamps were recorded', () => {
    expect(aggregateUserInterests(preferences({tags: ['animals']}))).toBe(
      'animals',
    )
  })

  it('passes the timestamp when the user has no selected interests', () => {
    expect(
      aggregateUserInterests(
        preferences({
          tags: [],
          updatedAt: '2026-09-03T17:00:00.000Z',
        }),
      ),
    ).toBe(';2026-09-03T17:00:00.000Z')
  })
})
