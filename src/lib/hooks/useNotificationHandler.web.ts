// Web shim for #/lib/hooks/useNotificationHandler. expo-notifications doesn't
// run on web, so the hook is a no-op and the helper functions only deal with
// pure-data payloads we receive from elsewhere.
//
// Keeping this file expo-notifications-free saves ~70KB on web.
import {AtUri} from '@atproto/api'

export type NotificationReason =
  | 'like'
  | 'repost'
  | 'follow'
  | 'mention'
  | 'reply'
  | 'quote'
  | 'chat-message'
  | 'chat-reaction'
  | 'chat-added-to-group'
  | 'chat-removed-from-group'
  | 'chat-join-request-rejected'
  | 'starterpack-joined'
  | 'like-via-repost'
  | 'repost-via-repost'
  | 'verified'
  | 'unverified'
  | 'subscribed-post'

type ChatNotificationReason = Extract<NotificationReason, `chat-${string}`>

export type NotificationPayload =
  | undefined
  | {
      reason: Exclude<NotificationReason, ChatNotificationReason>
      uri: string
      subject: string
      recipientDid: string
    }
  | {
      reason: 'chat-message'
      convoId: string
      messageId: string
      recipientDid: string
    }
  | {
      reason: 'chat-reaction'
      convoId: string
      messageId: string
      recipientDid: string
    }
  | {
      reason:
        | 'chat-added-to-group'
        | 'chat-removed-from-group'
        | 'chat-join-request-rejected'
      convoId: string
      recipientDid: string
    }

export type ChatNotificationPayload = Extract<
  NonNullable<NotificationPayload>,
  {reason: ChatNotificationReason}
>

export function isChatNotificationPayload(
  payload: NonNullable<NotificationPayload>,
): payload is ChatNotificationPayload {
  return payload.reason.startsWith('chat-')
}

export function useNotificationsHandler() {}

export function storePayloadForAccountSwitch(_payload: NotificationPayload) {}

// On web there's no expo-notifications object to inspect; callers from web
// code paths shouldn't invoke this, but we keep a stub that returns null.
export function getNotificationPayload(
  _e: unknown,
): NotificationPayload | null {
  return null
}

export function notificationToURL(payload: NotificationPayload): string | null {
  switch (payload?.reason) {
    case 'like':
    case 'repost':
    case 'like-via-repost':
    case 'repost-via-repost': {
      const urip = new AtUri(payload.subject)
      if (urip.collection === 'app.bsky.feed.post') {
        return `/profile/${urip.host}/post/${urip.rkey}`
      } else {
        return '/notifications'
      }
    }
    case 'reply':
    case 'quote':
    case 'mention':
    case 'subscribed-post': {
      const urip = new AtUri(payload.uri)
      if (urip.collection === 'app.bsky.feed.post') {
        return `/profile/${urip.host}/post/${urip.rkey}`
      } else {
        return '/notifications'
      }
    }
    case 'follow':
    case 'starterpack-joined': {
      const urip = new AtUri(payload.uri)
      return `/profile/${urip.host}`
    }
    case 'chat-message':
    case 'chat-reaction':
    case 'chat-added-to-group':
    case 'chat-removed-from-group':
    case 'chat-join-request-rejected':
      return null
    case 'verified':
    case 'unverified':
      return '/notifications'
    default:
      return null
  }
}
