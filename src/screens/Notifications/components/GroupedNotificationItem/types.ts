import {type $Typed} from '@atproto/lex'

import {type app} from '#/lexicons'

export type LikeGroup =
  $Typed<app.bsky.notification.getGroupedNotifications.LikeGroup>
export type MultiPostLikeGroup =
  $Typed<app.bsky.notification.getGroupedNotifications.MultiPostLikeGroup>
export type RepostGroup =
  $Typed<app.bsky.notification.getGroupedNotifications.RepostGroup>
export type LikeViaRepostGroup =
  $Typed<app.bsky.notification.getGroupedNotifications.LikeViaRepostGroup>
export type RepostViaRepostGroup =
  $Typed<app.bsky.notification.getGroupedNotifications.RepostViaRepostGroup>
export type FollowGroup =
  $Typed<app.bsky.notification.getGroupedNotifications.FollowGroup>
export type SubscribedPostGroup =
  $Typed<app.bsky.notification.getGroupedNotifications.SubscribedPostGroup>
export type GeneratorLikeGroup =
  $Typed<app.bsky.notification.getGroupedNotifications.GeneratorLikeGroup>
export type ReplyNotification =
  $Typed<app.bsky.notification.getGroupedNotifications.ReplyNotification>
export type QuoteNotification =
  $Typed<app.bsky.notification.getGroupedNotifications.QuoteNotification>
export type MentionNotification =
  $Typed<app.bsky.notification.getGroupedNotifications.MentionNotification>
export type FollowBackNotification =
  $Typed<app.bsky.notification.getGroupedNotifications.FollowBackNotification>
export type VerifiedNotification =
  $Typed<app.bsky.notification.getGroupedNotifications.VerifiedNotification>
export type UnverifiedNotification =
  $Typed<app.bsky.notification.getGroupedNotifications.UnverifiedNotification>
export type StarterPackJoinedNotification =
  $Typed<app.bsky.notification.getGroupedNotifications.StarterPackJoinedNotification>
export type ContactMatchNotification =
  $Typed<app.bsky.notification.getGroupedNotifications.ContactMatchNotification>

export type GroupedNotification =
  | LikeGroup
  | MultiPostLikeGroup
  | RepostGroup
  | LikeViaRepostGroup
  | RepostViaRepostGroup
  | FollowGroup
  | SubscribedPostGroup
  | GeneratorLikeGroup
  | ReplyNotification
  | QuoteNotification
  | MentionNotification
  | FollowBackNotification
  | VerifiedNotification
  | UnverifiedNotification
  | StarterPackJoinedNotification
  | ContactMatchNotification
