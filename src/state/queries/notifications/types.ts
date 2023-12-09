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
  items: FeedNotification[]
}

export interface CachedFeedPage {
  usableInFeed: boolean // if true, the cached page is recent enough to use as the response
  syncedAt: Date
  data: FeedPage | undefined
}
