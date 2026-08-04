import {type app} from '#/lexicons'

/**
 * A `listNotifications` notification, widened with the `starterPack` the server
 * attaches to a `follow` notification sourced from a starter pack. The pinned
 * lexicon does not declare the field yet, so it is added here rather than read
 * off an `unknown`. Drop this alias once the generated type carries it.
 */
export type Notification =
  app.bsky.notification.listNotifications.Notification & {
    starterPack?: app.bsky.graph.defs.StarterPackViewBasic
  }

export type NotificationType =
  | StarterPackNotificationType
  | OtherNotificationType

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
  items: FeedNotification[]
  priority: boolean
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
    | app.bsky.feed.defs.PostView
    | app.bsky.graph.defs.StarterPackViewBasic
}
