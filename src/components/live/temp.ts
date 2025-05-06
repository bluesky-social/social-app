import {DISCOVER_DEBUG_DIDS} from '#/lib/constants'
import type * as bsky from '#/types/bsky'

export const LIVE_DIDS: Record<string, true> = {
  'did:plc:7sfnardo5xxznxc6esxc5ooe': true,
}

// TEMP: dumb gating
export function temp__canBeLive(profile: bsky.profile.AnyProfileView) {
  if (__DEV__)
    return !!DISCOVER_DEBUG_DIDS[profile.did] || !!LIVE_DIDS[profile.did]
  return !!LIVE_DIDS[profile.did]
}

export function temp__canGoLive(profile: bsky.profile.AnyProfileView) {
  if (__DEV__) return true
  return !!LIVE_DIDS[profile.did]
}
