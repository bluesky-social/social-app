import {useMemo} from 'react'

import {BSKY_SERVICE} from '#/lib/constants'
import {type SessionAccount} from '#/state/session'
import {
  type MergeableMetadata,
  type SessionMetadata,
} from '#/analytics/metadata'

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
