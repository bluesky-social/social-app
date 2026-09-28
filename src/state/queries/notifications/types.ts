import {type app} from '#/lexicons'

export type Notification = app.bsky.notification.listNotifications.Notification

export type NotificationType =
  StarterPackNotificationType | OtherNotificationType

export type FeedNotification =
  | (FeedNotificationBase & {
      type: StarterPackNotificationType
      subject?: app.bsky.graph.defs.StarterPackViewBasic
    })
  | (FeedNotificationBase & {
      type: OtherNotificationType
      subject?: app.bsky.feed.defs.PostView
    })

export interface FeedPage {
  cursor: string | undefined
  seenAt: Date
  /** When the page was requested from the server, in ms since the epoch. */
  requestedAt: number
  items: FeedNotification[]
}

/**
 * What the last unread check found, for the lists that can offer it: the
 * Following v2 "New" pill on Notifications.
 */
export interface UnreadCheck {
  /** When the check asked the server, comparable with `FeedPage.requestedAt`. */
  requestedAt: number
  /**
   * When the newest unread notification each list would show was indexed, in
   * ms since the epoch, or undefined if the check found none.
   */
  newestUnreadAt: Record<'all' | 'mentions', number | undefined>
  /** Whether the check also loaded its page into the lists. */
  loadsIntoFeed: boolean
}

export interface CachedFeedPage {
  /**
   * if true, the cached page is recent enough to use as the response
   */
  usableInFeed: boolean
  syncedAt: Date
  data: FeedPage | undefined
  unreadCount: number
}

type StarterPackNotificationType = 'starterpack-joined'
type OtherNotificationType =
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

type FeedNotificationBase = {
  _reactKey: string
  notification: Notification
  additional?: Notification[]
  subjectUri?: string
  subject?:
    app.bsky.feed.defs.PostView | app.bsky.graph.defs.StarterPackViewBasic
}
