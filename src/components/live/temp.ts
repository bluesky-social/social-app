import {type AppBskyActorDefs, AppBskyEmbedExternal} from '@atproto/api'

import {DISCOVER_DEBUG_DIDS} from '#/lib/constants'
import type * as bsky from '#/types/bsky'

export const LIVE_DIDS: Record<string, true> = {
  'did:plc:7sfnardo5xxznxc6esxc5ooe': true, // nba.com
  'did:plc:gx6fyi3jcfxd7ammq2t7mzp2': true, // rtgame.bsky.social
}

export const LIVE_SOURCES: Record<string, true> = {
  'nba.com': true,
  'twitch.tv': true,
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

// status must have a embed, and the embed must be an approved host for the status to be valid
export function temp__isStatusValid(status: AppBskyActorDefs.StatusView) {
  if (status.status !== 'app.bsky.actor.status#live') return false
  try {
    if (AppBskyEmbedExternal.isView(status.embed)) {
      const url = new URL(status.embed.external.uri)
      return !!LIVE_SOURCES[url.hostname]
    } else {
      return false
    }
  } catch {
    return false
  }
}
