import {type AppBskyActorDefs} from '@atproto/api'

export const PEER_MOD_BADGE = 'peer-moderator'

type ProfileLike =
  | AppBskyActorDefs.ProfileViewBasic
  | AppBskyActorDefs.ProfileView
  | AppBskyActorDefs.ProfileViewDetailed
  | {did: string}

// Blacksky appview extension: active badge slugs ride profile views as
// an extra field the SDK types don't know about.
export function getActorBadges(profile: ProfileLike): string[] {
  const badges = (profile as {badges?: unknown}).badges
  if (!Array.isArray(badges)) return []
  return badges.filter((b): b is string => typeof b === 'string')
}

export function hasBadge(profile: ProfileLike, badge: string): boolean {
  return getActorBadges(profile).includes(badge)
}

// Badges the client has artwork for; unknown slugs render nothing.
export const KNOWN_BADGES = new Set([PEER_MOD_BADGE])

export function hasKnownBadge(profile: ProfileLike): boolean {
  return getActorBadges(profile).some(b => KNOWN_BADGES.has(b))
}
