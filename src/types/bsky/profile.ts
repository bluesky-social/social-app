import {type app, type chat} from '#/lexicons'

/**
 * Matches any profile view exported by our SDK.
 */
export type AnyProfileView =
  | app.bsky.actor.defs.ProfileViewBasic
  | app.bsky.actor.defs.ProfileView
  | app.bsky.actor.defs.ProfileViewDetailed
  | chat.bsky.actor.defs.ProfileViewBasic
