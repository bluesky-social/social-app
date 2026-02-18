import {useMemo} from 'react'

import {BSKY_SERVICE} from '#/lib/constants'
import {type SessionAccount} from '#/state/session'
import {getDeviceId, getSessionId} from '#/analytics/identifiers'
import {
  type MergeableMetadata,
  type SessionMetadata,
} from '#/analytics/metadata'
import {getIPGeolocationString} from '#/geolocation/util'

/**
 * Thin `useMemo` wrapper that marks the metadata as memoized and provides a
 * type guard.
 */
export function useMeta(metadata?: MergeableMetadata) {
  const m = useMemo(() => metadata, [metadata])
  if (!m) return
  // @ts-ignore
  m.__meta = true
  return m
}

export function accountToSessionMetadata(
  account: SessionAccount | undefined,
): SessionMetadata | undefined {
  if (!account) {
    return
  } else {
    return {
      did: account.did,
      isBskyPds: account.service.startsWith(BSKY_SERVICE),
    }
  }
}

/**
 * Get anonymous identifiers and construct headers we use for requests that may
 * trigger experiment exposures in our backend. These values are used for A/B
 * test bucketing, in addition to the user DID, if the request is
 * authenticated. They ensure we can consistently deliver beta features to
 * users.
 *
 * These headers must stay in sync with our appview.
 * @see https://github.com/bluesky-social/atproto/blob/39cf199df5847d3fd4a60d8cdeb604a0e07f9784/packages/bsky/src/feature-gates/utils.ts#L7-L8
 */
export function getAnalyticsHeaders() {
  return {
    'X-Bsky-Device-Id': getDeviceId(),
    'X-Bsky-Session-Id': getSessionId(),
    /**
     * This can already be inferred from server requests, but for consistency
     * in feature bucketing, we also include it here.
     */
    'X-Bsky-IP-Geolocation': getIPGeolocationString(),
  }
}
