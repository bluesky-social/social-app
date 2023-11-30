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
  sessDid: string // used to invalidate on session changes
  syncedAt: Date
  data: FeedPage | undefined
}
