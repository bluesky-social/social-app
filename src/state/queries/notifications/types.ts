import {
  type AppGndrFeedDefs,
  type AppGndrGraphDefs,
  type AppGndrNotificationListNotifications,
} from '@gander-social-atproto/api'

export type NotificationType =
  | StarterPackNotificationType
  | OtherNotificationType

export type FeedNotification =
  | (FeedNotificationBase & {
      type: StarterPackNotificationType
      subject?: AppGndrGraphDefs.StarterPackViewBasic
    })
  | (FeedNotificationBase & {
      type: OtherNotificationType
      subject?: AppGndrFeedDefs.PostView
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
  | 'unknown'

type FeedNotificationBase = {
  _reactKey: string
  notification: AppGndrNotificationListNotifications.Notification
  additional?: AppGndrNotificationListNotifications.Notification[]
  subjectUri?: string
  subject?: AppGndrFeedDefs.PostView | AppGndrGraphDefs.StarterPackViewBasic
}
