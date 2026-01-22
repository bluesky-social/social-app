import {useMemo} from 'react'

import {BSKY_SERVICE} from '#/lib/constants'
import {type SessionAccount} from '#/state/session'
import {
  type MergeableMetadata,
  type Metadata,
  type SessionMetadata,
} from '#/analytics/types'

/**
 * Thin `useMemo` wrapper that marks the metadata as memoized and provides a
 * type guard.
 */
export function useMeta(metadata: MergeableMetadata) {
  const m = useMemo(() => metadata, [metadata])
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

export function getMetadataForLogger({
  base,
  geolocation,
  session,
}: Metadata): Record<string, any> {
  return {
    deviceId: base.deviceId,
    sessionId: base.sessionId,
    platform: base.platform,
    appVersion: base.appVersion,
    countryCode: geolocation.countryCode,
    regionCode: geolocation.regionCode,
    isBskyPds: session?.isBskyPds || 'anonymous',
  }
}
