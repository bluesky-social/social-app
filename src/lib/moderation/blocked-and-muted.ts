import * as atp from '#/types/bsky'

export function isBlockedOrBlocking(profile: atp.profile.AnyProfileView) {
  return profile.viewer?.blockedBy || profile.viewer?.blocking
}

export function isMuted(profile: atp.profile.AnyProfileView) {
  return profile.viewer?.muted || profile.viewer?.mutedByList
}
