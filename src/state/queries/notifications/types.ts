import {
  AppBskyNotificationListNotifications,
  AppBskyFeedDefs,
} from '@atproto/api'

export type NotificationType =
  | 'post-like'
  | 'feedgen-like'
  | 'repost'
  | 'mention'
  | 'reply'
  | 'quote'
  | 'follow'
  | 'unknown'

export interface FeedNotification {
  _reactKey: string
  type: NotificationType
  notification: AppBskyNotificationListNotifications.Notification
  additional?: AppBskyNotificationListNotifications.Notification[]
  subjectUri?: string
  subject?: AppBskyFeedDefs.PostView
}

export interface FeedPage {
  cursor: string | undefined
  seenAt: Date
  items: FeedNotification[]
}

export interface CachedFeedPage {
  /**
   * if true, the cached page is recent enough to use as the response
   */
  usableInFeed: boolean
  syncedAt: Date
  data: FeedPage | undefined
}
