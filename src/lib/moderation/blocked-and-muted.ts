import * as atp from '#/types/atproto'

export function isBlockedOrBlocking(profile: atp.profile.AnyProfileView) {
  return profile.viewer?.blockedBy || profile.viewer?.blocking
}

export function isMuted(profile: atp.profile.AnyProfileView) {
  return profile.viewer?.muted || profile.viewer?.mutedByList
}
