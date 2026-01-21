import {useMemo} from 'react'

import {BSKY_SERVICE} from '#/lib/constants'
import {type SessionAccount} from '#/state/session'
import {type MergeableMetadata, type SessionMetadata} from '#/analytics/types'

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
