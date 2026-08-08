import {
  type AppBskyActorDefs,
  type AppBskyFeedDefs,
  type AppBskyGraphDefs,
  type AppBskyNotificationListNotifications,
  type AppBskyRichtextFacet,
  type ChatBskyActorDefs,
} from '@atproto/api'
import {
  hasMutedWord as sdkHasMutedWord,
  moderateFeedGenerator as sdkModerateFeedGenerator,
  moderateNotification as sdkModerateNotification,
  moderatePost as sdkModeratePost,
  moderateProfile as sdkModerateProfile,
  moderateStatus as sdkModerateStatus,
  moderateUserList as sdkModerateUserList,
  type ModerationDecision,
  type ModerationOpts,
} from '@bsky.app/sdk/moderation'

import {type app, type chat} from '#/lexicons'

/*
 * TRANSITIONAL. The moderation implementation now comes from
 * `@bsky.app/sdk/moderation`, whose subject types are the generated
 * `#/lexicons` views - so their `did`/`uri`/`cid` fields are branded
 * (`DidString`, `AtUriString`). Many read paths still emit the identically
 * shaped `@atproto/api` views, whose same fields are plain `string`.
 *
 * A plain `string` is not assignable to a branded template-literal type, so
 * every `moderate*` call taking an unmigrated view fails to typecheck even
 * though the value is byte-identical - the runtime only ever reads `.did`,
 * `.labels` and `.viewer`, none of which the brand affects.
 *
 * These wrappers widen each subject parameter to accept a view from either
 * world and drop the brand on the way in. Delete this module once every
 * producer emits `#/lexicons` views (the `@atproto/api` removal pass) and point
 * callers back at `@bsky.app/sdk/moderation` directly.
 */

type AnyProfileSubject =
  | app.bsky.actor.defs.ProfileViewBasic
  | app.bsky.actor.defs.ProfileView
  | app.bsky.actor.defs.ProfileViewDetailed
  | chat.bsky.actor.defs.ProfileViewBasic
  | AppBskyActorDefs.ProfileViewBasic
  | AppBskyActorDefs.ProfileView
  | AppBskyActorDefs.ProfileViewDetailed
  | ChatBskyActorDefs.ProfileViewBasic

type AnyPostSubject = app.bsky.feed.defs.PostView | AppBskyFeedDefs.PostView

type AnyUserListSubject =
  | app.bsky.graph.defs.ListViewBasic
  | app.bsky.graph.defs.ListView
  | AppBskyGraphDefs.ListViewBasic
  | AppBskyGraphDefs.ListView

type AnyFeedGeneratorSubject =
  | app.bsky.feed.defs.GeneratorView
  | AppBskyFeedDefs.GeneratorView

type AnyNotificationSubject =
  | app.bsky.notification.listNotifications.Notification
  | AppBskyNotificationListNotifications.Notification

export function moderateProfile(
  subject: AnyProfileSubject,
  opts: ModerationOpts,
): ModerationDecision {
  return sdkModerateProfile(subject as app.bsky.actor.defs.ProfileView, opts)
}

export function moderateStatus(
  subject: AnyProfileSubject,
  opts: ModerationOpts,
): ModerationDecision {
  return sdkModerateStatus(subject as app.bsky.actor.defs.ProfileView, opts)
}

export function moderatePost(
  subject: AnyPostSubject,
  opts: ModerationOpts,
): ModerationDecision {
  return sdkModeratePost(subject as app.bsky.feed.defs.PostView, opts)
}

export function moderateUserList(
  subject: AnyUserListSubject,
  opts: ModerationOpts,
): ModerationDecision {
  return sdkModerateUserList(subject as app.bsky.graph.defs.ListView, opts)
}

export function moderateFeedGenerator(
  subject: AnyFeedGeneratorSubject,
  opts: ModerationOpts,
): ModerationDecision {
  return sdkModerateFeedGenerator(
    subject as app.bsky.feed.defs.GeneratorView,
    opts,
  )
}

export function moderateNotification(
  subject: AnyNotificationSubject,
  opts: ModerationOpts,
): ModerationDecision {
  return sdkModerateNotification(
    subject as app.bsky.notification.listNotifications.Notification,
    opts,
  )
}

/**
 * Widens `facets`/`actor` for the same reason the `moderate*` wrappers widen
 * their subjects: mute-word matching reads only `text`/`features`/`langs`, none
 * of which the brand affects.
 */
export function hasMutedWord(params: {
  mutedWords: app.bsky.actor.defs.MutedWord[]
  text: string
  facets?: app.bsky.richtext.facet.Main[] | AppBskyRichtextFacet.Main[]
  outlineTags?: string[]
  languages?: string[]
  actor?: AnyProfileSubject
}): boolean {
  return sdkHasMutedWord({
    ...params,
    facets: params.facets as app.bsky.richtext.facet.Main[] | undefined,
    actor: params.actor as app.bsky.actor.defs.ProfileView | undefined,
  })
}
