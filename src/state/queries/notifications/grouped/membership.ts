import {type GroupedNotificationsFeed} from '#/state/queries/notifications/grouped/types'
import {type app} from '#/lexicons'

type Notification = app.bsky.notification.listNotifications.Notification

/**
 * The `listNotifications` reasons that grouped notifications cover. Anything
 * else, e.g. a reason added since, has no kind to show as.
 */
const GROUPED_REASONS = new Set<string>([
  'like',
  'repost',
  'follow',
  'mention',
  'reply',
  'quote',
  'starterpack-joined',
  'verified',
  'unverified',
  'like-via-repost',
  'repost-via-repost',
  'subscribed-post',
  'contact-match',
])

const CONVERSATION_REASONS = new Set<string>(['reply', 'quote', 'mention'])

/**
 * Whether a notification from `listNotifications` belongs in a grouped
 * notifications feed, judging by its reason and its author's viewer state.
 *
 * The server decides membership, so this is an estimate that leaves a
 * notification out wherever it's unsure:
 *
 * - "People you follow" is every reason, from authors the viewer follows.
 * - "Followers" is follows, including follow-backs.
 * - "Replies" is replies, quotes and mentions.
 * - "Activity" is posts from accounts the viewer subscribes to. It may hold
 *   more than that, which this misses rather than guesses at.
 */
export function isInGroupedFeed(
  feed: GroupedNotificationsFeed,
  notification: Notification,
): boolean {
  const {reason} = notification
  if (!GROUPED_REASONS.has(reason)) return false
  switch (feed) {
    case 'all':
      return true
    case 'people-i-follow':
      return !!notification.author.viewer?.following
    case 'followers':
      return reason === 'follow'
    case 'conversations':
      return CONVERSATION_REASONS.has(reason)
    case 'activity':
      return reason === 'subscribed-post'
  }
}
