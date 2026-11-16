import {type Client} from '@atproto/lex'
import {
  hasMutedWord,
  moderateNotification,
  type ModerationOpts,
} from '@bsky/sdk/moderation'

import {labelIsHideableOffense} from '#/lib/moderation'
import {isInGroupedFeed} from '#/state/queries/notifications/grouped/membership'
import {type GroupedNotificationsFeed} from '#/state/queries/notifications/grouped/types'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {type Notification, type UnreadCheck} from './types'

/**
 * Fetches the newest notifications for an unread check, leaving out those
 * that moderation would hide.
 */
export async function fetchUnreadCheckPage({
  client,
  limit,
  moderationOpts,
}: {
  client: Client
  limit: number
  moderationOpts: ModerationOpts | undefined
}): Promise<{notifications: Notification[]}> {
  const data = await client.call(app.bsky.notification.listNotifications, {
    limit,
  })
  return {
    notifications: data.notifications.filter(
      notif => !shouldFilterNotif(notif, moderationOpts),
    ),
  }
}

/**
 * Summarizes an unread check's page for the grouped notifications feeds; see
 * `UnreadCheck`.
 */
export function summarizeUnreadCheck(
  notifications: Notification[],
  requestedAt: number,
): UnreadCheck {
  const newestUnreadAt: UnreadCheck['newestUnreadAt'] = {
    all: undefined,
    'people-i-follow': undefined,
    followers: undefined,
    conversations: undefined,
    activity: undefined,
  }
  const feeds = Object.keys(newestUnreadAt) as GroupedNotificationsFeed[]
  for (const notif of notifications) {
    if (notif.isRead) continue
    const indexedAt = Date.parse(notif.indexedAt)
    for (const feed of feeds) {
      if (
        indexedAt > (newestUnreadAt[feed] ?? -Infinity) &&
        isInGroupedFeed(feed, notif)
      ) {
        newestUnreadAt[feed] = indexedAt
      }
    }
  }
  return {requestedAt, newestUnreadAt}
}

/**
 * An unread check once everything indexed up to `seenAt` has been marked
 * read, as the next check would find it.
 */
export function markUnreadCheckSeen(
  check: UnreadCheck | undefined,
  seenAt: number,
): UnreadCheck | undefined {
  if (!check) return check
  const newestUnreadAt = {...check.newestUnreadAt}
  for (const feed of Object.keys(
    newestUnreadAt,
  ) as GroupedNotificationsFeed[]) {
    if ((newestUnreadAt[feed] ?? -Infinity) <= seenAt) {
      newestUnreadAt[feed] = undefined
    }
  }
  return {...check, newestUnreadAt}
}

export function shouldFilterNotif(
  notif: Notification,
  moderationOpts: ModerationOpts | undefined,
): boolean {
  const containsImperative = !!notif.author.labels?.some(labelIsHideableOffense)
  if (containsImperative) {
    return true
  }
  if (!moderationOpts) {
    return false
  }
  if (
    notif.reason === 'subscribed-post' &&
    bsky.isType(app.bsky.feed.post, notif.record) &&
    hasMutedWord({
      mutedWords: moderationOpts.prefs.mutedWords,
      text: notif.record.text,
      facets: notif.record.facets,
      outlineTags: notif.record.tags,
      languages: notif.record.langs,
      actor: notif.author,
    })
  ) {
    return true
  }
  if (notif.author.viewer?.following) {
    return false
  }
  return moderateNotification(notif, moderationOpts).ui('contentList').filter
}
