/**
 * [CHATDBG] TEMPORARY dev-only helper for reproducing the "chat opened from a
 * push never finishes loading" bug (APP-2238).
 *
 * Schedules a LOCAL notification that mimics a chat push payload. Local notifs
 * can't produce a real `'push'` trigger, so we tag the payload with `__chatdbg`
 * and `getNotificationPayload` lets it through in dev (see
 * useNotificationHandler.ts).
 *
 * Usage: call this, then immediately background the app. When the banner
 * appears, tap it - the tap handler routes to the convo exactly like a real
 * push, while Metro captures the [CHATDBG] timeline.
 *
 * DELETE THIS FILE when the investigation is done.
 */
import * as Notifications from 'expo-notifications'

import {logger} from '#/logger'

export async function scheduleTestChatNotification({
  convoId,
  recipientDid,
  delaySeconds = 4,
}: {
  convoId: string
  recipientDid: string
  delaySeconds?: number
}) {
  const perms = await Notifications.getPermissionsAsync()
  if (!perms.granted) {
    const req = await Notifications.requestPermissionsAsync()
    if (!req.granted) {
      logger.warn('[CHATDBG] notification permission not granted, cannot test')
      return false
    }
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '[CHATDBG] Test chat message',
      body: 'Tap me after backgrounding the app',
      data: {
        __chatdbg: true,
        reason: 'chat-message',
        convoId,
        messageId: '__chatdbg_test__',
        recipientDid,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: delaySeconds,
    },
  })

  logger.debug('[CHATDBG] scheduled test chat notification', {
    convoId,
    recipientDid,
    delaySeconds,
  })
  return true
}
