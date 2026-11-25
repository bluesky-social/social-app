import {type GroupedNotificationsFeed} from '#/state/queries/notifications/grouped/types'
import {type app} from '#/lexicons'

export type Notification = app.bsky.notification.listNotifications.Notification

/**
 * What the last unread check found, for the Notifications screen's "Refresh" pill.
 */
export interface UnreadCheck {
  /**
   * When the check asked the server, in ms since the epoch.
   */
  requestedAt: number
  /**
   * For each grouped notifications feed, when the newest unread notification
   * the check found for it was indexed, in ms since the epoch, or undefined
   * if it found none.
   */
  newestUnreadAt: Record<GroupedNotificationsFeed, number | undefined>
}

/**
 * The names the original notifications screen gave each kind, which metrics
 * such as `notifications:bundleExpand` still use so they stay comparable.
 */
export type NotificationType =
  | 'starterpack-joined'
  | 'post-like'
  | 'repost'
  | 'mention'
  | 'reply'
  | 'quote'
  | 'follow'
  | 'feedgen-like'
  | 'verified'
  | 'unverified'
  | 'like-via-repost'
  | 'repost-via-repost'
  | 'subscribed-post'
  | 'contact-match'
  | 'unknown'
