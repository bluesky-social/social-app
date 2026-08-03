import {type AppBskyActorDefs, type ChatBskyActorDefs} from '@atproto/api'

import {type app, type chat} from '#/lexicons'

/**
 * Matches any profile view exported by our SDK, in either world.
 *
 * Both the generated `#/lexicons` views and the `@atproto/api` views are
 * accepted because both are live producers: queries migrated to the lexicon
 * client emit the former, unmigrated ones emit the latter, and consumers of
 * this alias take profiles from both.
 *
 * TODO: remove the @atproto/api arms once all producers emit #/lexicons views
 */
export type AnyProfileView =
  | app.bsky.actor.defs.ProfileViewBasic
  | app.bsky.actor.defs.ProfileView
  | app.bsky.actor.defs.ProfileViewDetailed
  | chat.bsky.actor.defs.ProfileViewBasic
  | AppBskyActorDefs.ProfileViewBasic
  | AppBskyActorDefs.ProfileView
  | AppBskyActorDefs.ProfileViewDetailed
  | ChatBskyActorDefs.ProfileViewBasic
