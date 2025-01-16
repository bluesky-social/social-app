import {AppBskyActorDefs, ChatBskyActorDefs} from '@atproto/api'

export const isBasicView = AppBskyActorDefs.isProfileViewBasic
export const isDetailedView = AppBskyActorDefs.isProfileViewDetailed
export const isView = AppBskyActorDefs.isProfileView

/**
 * Matches any profile view exported by our SDK
 */
export type AnyProfileView =
  | AppBskyActorDefs.ProfileViewBasic
  | AppBskyActorDefs.ProfileView
  | AppBskyActorDefs.ProfileViewDetailed
  | ChatBskyActorDefs.ProfileViewBasic
