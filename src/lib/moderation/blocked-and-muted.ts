import * as bsky from '#/types/bsky'

export function isBlockedOrBlocking(profile: bsky.profile.AnyProfileView) {
  return profile.viewer?.blockedBy || profile.viewer?.blocking
}

export function isMuted(profile: bsky.profile.AnyProfileView) {
  return profile.viewer?.muted || profile.viewer?.mutedByList
}
