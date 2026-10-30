import {Platform} from 'react-native'
import {AtUri} from '@atproto/syntax'

import {BSKY_FEED_OWNER_DIDS} from '#/lib/constants'
import {type UsePreferencesQueryResponse} from '#/state/queries/preferences'
import {IS_WEB} from '#/env'
import {device} from '#/storage'

let debugTopics = ''
if (IS_WEB && typeof window !== 'undefined') {
  const params = new URLSearchParams(window.location.search)
  debugTopics = params.get('debug_topics') ?? ''
}

export function createBskyTopicsHeader(userInterests?: string) {
  return {
    'x-atproto-bsky-topics': debugTopics || userInterests || '',
  }
}

/**
 * Only disclose platform and IP-based service data to Bluesky-owned feeds,
 * never GPS data.
 * Read at request time so long-lived feed APIs pick up service updates.
 */
export function createBskyFeedHeaders(feedUri: string) {
  const headers: Record<string, string> = {}
  if (!isBlueskyOwnedFeed(feedUri)) return headers

  headers['x-atproto-bsky-platform'] = Platform.OS

  const geolocation = device.get(['geolocationServiceResponse'])
  if (geolocation?.countryCode) {
    headers['x-atproto-bsky-geo-country'] = geolocation.countryCode
  }
  if (geolocation?.regionCode) {
    headers['x-atproto-bsky-geo-region'] = geolocation.regionCode
  }
  if (geolocation?.city) {
    headers['x-atproto-bsky-geo-city'] = encodeURIComponent(geolocation.city)
  }
  if (geolocation?.ip) {
    headers['x-atproto-bsky-geo-ip'] = geolocation.ip
  }
  return headers
}

export function aggregateUserInterests(
  preferences?: UsePreferencesQueryResponse,
) {
  const tags = preferences?.interests.tags ?? []
  const updatedAt = preferences?.interests.updatedAt

  const interests = tags.join(',')
  return updatedAt ? `${interests};${updatedAt}` : interests
}

export function isBlueskyOwnedFeed(feedUri: string) {
  const uri = new AtUri(feedUri)
  return BSKY_FEED_OWNER_DIDS.includes(uri.host)
}
