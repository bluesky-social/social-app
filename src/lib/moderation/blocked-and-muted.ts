import {AppBskyActorDefs} from '@atproto/api'

export function isBlockedOrBlocking(
  profile:
    | AppBskyActorDefs.ProfileViewBasic
    | AppBskyActorDefs.ProfileViewDetailed,
) {
  return profile.viewer?.blockedBy || profile.viewer?.blocking
}

export function isMuted(
  profile:
    | AppBskyActorDefs.ProfileViewBasic
    | AppBskyActorDefs.ProfileViewDetailed,
) {
  return profile.viewer?.muted || profile.viewer?.mutedByList
}
