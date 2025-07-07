import * as gndr from '#/types/gndr'

export function isBlockedOrBlocking(profile: gndr.profile.AnyProfileView) {
  return profile.viewer?.blockedBy || profile.viewer?.blocking
}

export function isMuted(profile: gndr.profile.AnyProfileView) {
  return profile.viewer?.muted || profile.viewer?.mutedByList
}
