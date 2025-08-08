import {
  type AppGndrActorDefs,
  type ChatGndrActorDefs,
} from '@gander-social-atproto/api'

/**
 * Matches any profile view exported by our SDK
 */
export type AnyProfileView =
  | AppGndrActorDefs.ProfileViewBasic
  | AppGndrActorDefs.ProfileView
  | AppGndrActorDefs.ProfileViewDetailed
  | ChatGndrActorDefs.ProfileViewBasic
