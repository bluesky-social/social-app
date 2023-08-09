import * as Notifications from 'expo-notifications'
import {RootStoreModel} from '../../state'
import {resetToTab} from '../../Navigation'
import {devicePlatform, isIOS} from 'platform/detection'
// type NotificationReason =
//   | 'like'
//   | 'repost'
//   | 'follow'
//   | 'mention'
//   | 'reply'
//   | 'quote'

export function init(store: RootStoreModel) {
  store.onUnreadNotifications(count => Notifications.setBadgeCountAsync(count))
  // store.onPushNotification(d isplayNotificationFromModel)
  // In rare situations, a push token may be changed by the push notification service while the app is running. When a token is rolled, the old one becomes invalid and sending notifications to it will fail. A push token listener will let you handle this situation gracefully by registering the new token with your backend right away.

  store.onSessionLoaded(async () => {
    // request notifications permission once the user has logged in
    const perms = await Notifications.getPermissionsAsync()
    if (!perms.granted) {
      await Notifications.requestPermissionsAsync()
    }

    // register the push token with the server
    const token = await getPushToken()
    if (token) {
      try {
        await store.agent.api.app.bsky.unspecced.registerPushNotificationEndpoint(
          {
            platform: devicePlatform,
            token: token.data,
            endpoint: 'app.bsky.unspecced.putNotificationPushToken',
            appId: 'xyz.blueskyweb.app',
          },
        )
        store.log.debug(
          'Notifications: Sent push token' + token.data + token.type,
        )
      } catch (error) {
        store.log.error('Notifications: Failed to set push token', error)
      }
    }

    // listens for new changes to the push token
    Notifications.addPushTokenListener(async ({data: t, type}) => {
      store.log.debug('Notifications: Push token changed', {t, type})
      if (token) {
        try {
          await store.agent.api.app.bsky.unspecced.registerPushNotificationEndpoint(
            {
              platform: devicePlatform,
              token: t,
              endpoint: 'app.bsky.unspecced.putNotificationPushToken',
              appId: 'xyz.blueskyweb',
            },
          )
          store.log.debug('Notifications: Sent push token', t + type)
        } catch (error) {
          store.log.error('Notifications: Failed to set push token', error)
        }
      }
    })
  })
  // handle notifications that are tapped on, regardless of whether the app is in the foreground or background
  Notifications.addNotificationReceivedListener(event => {
    store.log.debug('Notifications: received', event)
    if (event.request.trigger.type === 'push') {
      let payload
      if (isIOS) {
        payload = event.request.trigger.payload
      } else {
        // TODO: handle android payload
        // payload = event.request.trigger.remoteMessage?.data
      }
      if (payload) {
        store.log.debug('Notifications: received payload', payload)
        // TODO: deeplink notif here
        // const reason = payload.reason as NotificationReason
      }
    }
  })

  const sub = Notifications.addNotificationResponseReceivedListener(
    response => {
      console.log('NOTIFICATION RESPONSE LISTENER')
      store.log.debug(
        'Notifications: response received',
        response.actionIdentifier,
      )
      if (
        response.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER
      ) {
        store.log.debug('User pressed a notifee, opening notifications')
        resetToTab('NotificationsTab')
      }
    },
  )

  return () => {
    sub.remove()
  }
}

export function getPushToken() {
  return Notifications.getDevicePushTokenAsync()
}
