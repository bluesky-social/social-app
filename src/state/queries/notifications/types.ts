import {
  AppBskyFeedDefs,
  AppBskyGraphDefs,
  AppBskyNotificationListNotifications,
} from '@atproto/api'

export type NotificationType =
  | StarterPackNotificationType
  | OtherNotificationType

export type FeedNotification =
  | (FeedNotificationBase & {
      type: StarterPackNotificationType
      subject?: AppBskyGraphDefs.StarterPackViewBasic
    })
  | (FeedNotificationBase & {
      type: OtherNotificationType
      subject?: AppBskyFeedDefs.PostView
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
  | 'unknown'

type FeedNotificationBase = {
  _reactKey: string
  notification: AppBskyNotificationListNotifications.Notification
  additional?: AppBskyNotificationListNotifications.Notification[]
  subjectUri?: string
  subject?: AppBskyFeedDefs.PostView | AppBskyGraphDefs.StarterPackViewBasic
}
