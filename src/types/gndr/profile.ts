import {
  type AppBskyActorDefs as AppGndrActorDefs,
  type ChatBskyActorDefs as ChatGndrActorDefs,
} from '@atproto/api'

/**
 * Matches any profile view exported by our SDK
 */
export type AnyProfileView =
  | AppGndrActorDefs.ProfileViewBasic
  | AppGndrActorDefs.ProfileView
  | AppGndrActorDefs.ProfileViewDetailed
  | ChatGndrActorDefs.ProfileViewBasic
