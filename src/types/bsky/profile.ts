import {type AppBskyActorDefs, type ChatBskyActorDefs} from '@atproto/api'

import {type app, type chat} from '#/lexicons'

/**
 * Matches any profile view exported by our SDK.
 *
 * TODO(phase4): drop the `@atproto/api` arms. This is a dual-world widening
 * alias for the migration interim: profile producers (state/queries/profile.ts
 * etc.) still return old `@atproto/api` views via the bridge agent, so the
 * union must accept both the new `#/lexicons` views (the target) and the old
 * ones until those producers flip. Once every producer emits `#/lexicons`
 * views, remove the old arms and this becomes a pure new-world union.
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
