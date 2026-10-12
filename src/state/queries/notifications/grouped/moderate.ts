import {
  hasMutedWord,
  moderatePost,
  moderateProfile,
  type ModerationOpts,
} from '@bsky/sdk/moderation'

import {labelIsHideableOffense} from '#/lib/moderation'
import {
  isNonEmpty,
  type NotificationView,
} from '#/state/queries/notifications/grouped/types'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'

type ProfileView = app.bsky.actor.defs.ProfileViewDetailed
type PostView = app.bsky.feed.defs.PostView

/**
 * What the list-time moderation rules depend on, besides the notification.
 */
export type NotificationModerationArgs = {
  /**
   * When unset, only the rules that don't need preferences apply (hideable
   * offenses and threadgate-hidden replies).
   */
  moderationOpts: ModerationOpts | undefined
  /**
   * Replies the viewer has hidden with a threadgate.
   */
  hiddenReplyUris: ReadonlySet<string>
}

/**
 * The list-time moderation rules for one grouped notification: whether it
 * belongs in the list at all, and which of its actors or items do. This is
 * separate from render-time moderation (blurs, alerts, hidden names), which
 * each row applies itself.
 *
 * Returns the same object when nothing is hidden, a copy with the hidden
 * actors or items removed when only some are, or `undefined` when the whole
 * notification should be dropped. Views are never copied.
 */
export function moderateNotification(
  notification: NotificationView,
  {moderationOpts, hiddenReplyUris}: NotificationModerationArgs,
): NotificationView | undefined {
  switch (notification.type) {
    case 'like':
    case 'repost':
    case 'likeViaRepost':
    case 'repostViaRepost':
    case 'generatorLike': {
      const actors = notification.actors.filter(
        actor => !isActorHidden(actor, moderationOpts),
      )
      if (actors.length === notification.actors.length) return notification
      if (!isNonEmpty(actors)) return undefined
      // `count` stays as the server's total, hidden actors included.
      return {...notification, actors}
    }
    case 'follow': {
      const hiddenDids = new Set(
        notification.actors
          .filter(actor => isActorHidden(actor, moderationOpts))
          .map(actor => actor.did),
      )
      if (hiddenDids.size === 0) return notification
      const actors = notification.actors.filter(
        actor => !hiddenDids.has(actor.did),
      )
      if (!isNonEmpty(actors)) return undefined
      return {
        ...notification,
        actors,
        /*
         * Hidden actors leave `actorDids` too, or "Show more" would load them
         * only to hide them again.
         */
        actorDids: notification.actorDids.filter(did => !hiddenDids.has(did)),
      }
    }
    case 'multiPostLike':
    case 'followBack':
    case 'verified':
    case 'unverified':
    case 'starterPackJoined':
    case 'contactMatch': {
      return isActorHidden(notification.actor, moderationOpts)
        ? undefined
        : notification
    }
    case 'subscribedPost': {
      const items = notification.items.filter(
        item =>
          !isActorHidden(item.actor, moderationOpts) &&
          !hasMutedWordInPost(item.post, moderationOpts) &&
          !isSubscribedPostHidden(item.post, moderationOpts),
      )
      if (items.length === notification.items.length) return notification
      if (!isNonEmpty(items)) return undefined
      return {...notification, items}
    }
    case 'reply':
    case 'quote':
    case 'mention': {
      if (
        notification.type === 'reply' &&
        hiddenReplyUris.has(notification.post.uri)
      ) {
        return undefined
      }
      if (
        moderationOpts &&
        moderatePost(notification.post, moderationOpts).ui('contentList').filter
      ) {
        return undefined
      }
      return notification
    }
  }
}

/**
 * Whether an actor is left out of notification lists. Mirrors the actor rules
 * of the legacy `shouldFilterNotif`: hideable offenses are always hidden,
 * otherwise anyone the viewer follows is kept.
 */
export function isActorHidden(
  actor: ProfileView,
  moderationOpts: ModerationOpts | undefined,
): boolean {
  if (actor.labels?.some(labelIsHideableOffense)) return true
  if (!moderationOpts) return false
  if (actor.viewer?.following) return false
  return moderateProfile(actor, moderationOpts).ui('contentList').filter
}

/**
 * Subscribed posts are someone else's new content, so their own labels apply
 * too. As with actors, posts by people the viewer follows are kept.
 */
function isSubscribedPostHidden(
  post: PostView,
  moderationOpts: ModerationOpts | undefined,
): boolean {
  if (!moderationOpts || post.author.viewer?.following) return false
  return moderatePost(post, moderationOpts).ui('contentList').filter
}

function hasMutedWordInPost(
  post: PostView,
  moderationOpts: ModerationOpts | undefined,
): boolean {
  if (!moderationOpts || !bsky.isType(app.bsky.feed.post, post.record)) {
    return false
  }
  return hasMutedWord({
    mutedWords: moderationOpts.prefs.mutedWords,
    text: post.record.text,
    facets: post.record.facets,
    outlineTags: post.record.tags,
    languages: post.record.langs,
    actor: post.author,
  })
}
