import {useEffect} from 'react'
import {Linking} from 'react-native'
import * as Notifications from 'expo-notifications'
import BackgroundNotificationHandler from '@bsky.app/expo-background-notification-handler'
import {useLingui} from '@lingui/react/macro'

import {type NotificationReason} from '#/lib/hooks/useNotificationHandler'
import {logger} from '#/lib/notifications/util'
import {IS_ANDROID} from '#/env'

/**
 * Android notification channel for every chat push. Must match
 * `CHAT_CHANNEL_ID` in the native `BlueskyFirebaseMessagingDelegate`, which
 * assigns chat pushes to it.
 */
export const CHAT_CHANNEL_ID = 'chat'

/**
 * Chat pushes were meant to go to one of these, depending on the in-app chat
 * sound toggle. That never worked on Android, and they've been replaced by
 * {@link CHAT_CHANNEL_ID}, whose sound users can change in system settings.
 */
const LEGACY_CHAT_CHANNEL_IDS = ['chat-messages', 'chat-messages-muted']
const LEGACY_CHAT_CHANNEL_GROUP_ID = 'chat'

/**
 * Creates the app's Android notification channels, or updates their names if
 * they already exist. Once a channel exists, Android only lets the app change
 * its name and description - the sound, importance and so on belong to the
 * user - so changing those means creating a channel with a new ID.
 */
export function useNotificationChannels() {
  const {t: l} = useLingui()

  useEffect(() => {
    if (!IS_ANDROID) return

    setUpChatChannel(l`Chat messages`).catch(error => {
      logger.error('useNotificationChannels: failed to set up chat channel', {
        safeMessage: error,
      })
    })

    const socialChannels: [NotificationReason, string][] = [
      ['like', l`Likes`],
      ['repost', l`Reposts`],
      ['reply', l`Replies`],
      ['mention', l`Mentions`],
      ['quote', l`Quotes`],
      ['follow', l`New followers`],
      ['like-via-repost', l`Likes of your reposts`],
      ['repost-via-repost', l`Reposts of your reposts`],
      ['subscribed-post', l`Activity from others`],
    ]
    for (const [id, name] of socialChannels) {
      void Notifications.setNotificationChannelAsync(id, {
        name,
        importance: Notifications.AndroidImportance.HIGH,
      })
    }
  }, [l])
}

async function setUpChatChannel(name: string) {
  /*
   * Android ignores sound changes to a channel that already exists, so the
   * old in-app toggle is only read when this channel is first created.
   */
  const {playSoundChat} = await BackgroundNotificationHandler.getAllPrefsAsync()
  await Notifications.setNotificationChannelAsync(CHAT_CHANNEL_ID, {
    name,
    importance: Notifications.AndroidImportance.HIGH,
    sound: playSoundChat === false ? null : 'dm.mp3',
    enableVibrate: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
  })

  await Promise.all([
    ...LEGACY_CHAT_CHANNEL_IDS.map(id =>
      Notifications.deleteNotificationChannelAsync(id),
    ),
    Notifications.deleteNotificationChannelGroupAsync(
      LEGACY_CHAT_CHANNEL_GROUP_ID,
    ),
  ])
}

/**
 * Opens the system settings page for one of the app's notification channels,
 * falling back to the app's settings page. Android only.
 */
export async function openNotificationChannelSettings(channelId: string) {
  try {
    await Linking.sendIntent('android.settings.CHANNEL_NOTIFICATION_SETTINGS', [
      {key: 'android.provider.extra.APP_PACKAGE', value: 'xyz.blueskyweb.app'},
      {key: 'android.provider.extra.CHANNEL_ID', value: channelId},
    ])
  } catch {
    void Linking.openSettings()
  }
}
