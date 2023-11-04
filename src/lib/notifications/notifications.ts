import * as Notifications from 'expo-notifications'
import {RootStoreModel} from '../../state'
import {resetToTab} from '../../Navigation'
import {devicePlatform, isIOS} from 'platform/detection'
import {track} from 'lib/analytics/analytics'

const SERVICE_DID = (serviceUrl?: string) =>
  serviceUrl?.includes('staging')
    ? 'did:web:api.staging.bsky.dev'
    : 'did:web:api.bsky.app'

export function init(store: RootStoreModel) {
  store.onUnreadNotifications(count => Notifications.setBadgeCountAsync(count))

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
        await store.agent.api.app.bsky.notification.registerPush({
          serviceDid: SERVICE_DID(store.session.data?.service),
          platform: devicePlatform,
          token: token.data,
          appId: 'xyz.blueskyweb.app',
        })
        store.log.debug('Notifications: Sent push token (init)', {
          tokenType: token.type,
          token: token.data,
        })
      } catch (error) {
        store.log.error('Notifications: Failed to set push token', {error})
      }
    }

    // listens for new changes to the push token
    // In rare situations, a push token may be changed by the push notification service while the app is running. When a token is rolled, the old one becomes invalid and sending notifications to it will fail. A push token listener will let you handle this situation gracefully by registering the new token with your backend right away.
    Notifications.addPushTokenListener(async ({data: t, type}) => {
      store.log.debug('Notifications: Push token changed', {t, tokenType: type})
      if (t) {
        try {
          await store.agent.api.app.bsky.notification.registerPush({
            serviceDid: SERVICE_DID(store.session.data?.service),
            platform: devicePlatform,
            token: t,
            appId: 'xyz.blueskyweb.app',
          })
          store.log.debug('Notifications: Sent push token (event)', {
            tokenType: type,
            token: t,
          })
        } catch (error) {
          store.log.error('Notifications: Failed to set push token', {error})
        }
      }
    })
  })

  // handle notifications that are received, both in the foreground or background
  Notifications.addNotificationReceivedListener(event => {
    store.log.debug('Notifications: received', {event})
    if (event.request.trigger.type === 'push') {
      // refresh notifications in the background
      store.me.notifications.syncQueue()
      // handle payload-based deeplinks
      let payload
      if (isIOS) {
        payload = event.request.trigger.payload
      } else {
        // TODO: handle android payload deeplink
      }
      if (payload) {
        store.log.debug('Notifications: received payload', payload)
        // TODO: deeplink notif here
      }
    }
  })

  // handle notifications that are tapped on
  const sub = Notifications.addNotificationResponseReceivedListener(
    response => {
      store.log.debug('Notifications: response received', {
        actionIdentifier: response.actionIdentifier,
      })
      if (
        response.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER
      ) {
        store.log.debug(
          'User pressed a notification, opening notifications tab',
        )
        track('Notificatons:OpenApp')
        store.me.notifications.refresh() // refresh notifications
        resetToTab('NotificationsTab') // open notifications tab
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
