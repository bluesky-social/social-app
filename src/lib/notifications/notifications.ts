import * as Notifications from 'expo-notifications'
import {QueryClient} from '@tanstack/react-query'
import {resetToTab} from '../../Navigation'
import {devicePlatform, isIOS} from 'platform/detection'
import {track} from 'lib/analytics/analytics'
import {logger} from '#/logger'
import {RQKEY as RQKEY_NOTIFS} from '#/state/queries/notifications/feed'
import {truncateAndInvalidate} from '#/state/queries/util'
import {SessionAccount, getAgent} from '#/state/session'

const SERVICE_DID = (serviceUrl?: string) =>
  serviceUrl?.includes('staging')
    ? 'did:web:api.staging.bsky.dev'
    : 'did:web:api.bsky.app'

export async function requestPermissionsAndRegisterToken(
  account: SessionAccount,
) {
  // request notifications permission once the user has logged in
  const perms = await Notifications.getPermissionsAsync()
  if (!perms.granted) {
    await Notifications.requestPermissionsAsync()
  }

  // register the push token with the server
  const token = await Notifications.getDevicePushTokenAsync()
  try {
    await getAgent().api.app.bsky.notification.registerPush({
      serviceDid: SERVICE_DID(account.service),
      platform: devicePlatform,
      token: token.data,
      appId: 'xyz.blueskyweb.app',
    })
    logger.debug(
      'Notifications: Sent push token (init)',
      {
        tokenType: token.type,
        token: token.data,
      },
      logger.DebugContext.notifications,
    )
  } catch (error) {
    logger.error('Notifications: Failed to set push token', {message: error})
  }
}

export function registerTokenChangeHandler(
  account: SessionAccount,
): () => void {
  // listens for new changes to the push token
  // In rare situations, a push token may be changed by the push notification service while the app is running. When a token is rolled, the old one becomes invalid and sending notifications to it will fail. A push token listener will let you handle this situation gracefully by registering the new token with your backend right away.
  const sub = Notifications.addPushTokenListener(async newToken => {
    logger.debug(
      'Notifications: Push token changed',
      {tokenType: newToken.data, token: newToken.type},
      logger.DebugContext.notifications,
    )
    try {
      await getAgent().api.app.bsky.notification.registerPush({
        serviceDid: SERVICE_DID(account.service),
        platform: devicePlatform,
        token: newToken.data,
        appId: 'xyz.blueskyweb.app',
      })
      logger.debug(
        'Notifications: Sent push token (event)',
        {
          tokenType: newToken.type,
          token: newToken.data,
        },
        logger.DebugContext.notifications,
      )
    } catch (error) {
      logger.error('Notifications: Failed to set push token', {message: error})
    }
  })
  return () => {
    sub.remove()
  }
}

export function init(queryClient: QueryClient) {
  // handle notifications that are received, both in the foreground or background
  // NOTE: currently just here for debug logging
  Notifications.addNotificationReceivedListener(event => {
    logger.debug(
      'Notifications: received',
      {event},
      logger.DebugContext.notifications,
    )
    if (event.request.trigger.type === 'push') {
      // handle payload-based deeplinks
      let payload
      if (isIOS) {
        payload = event.request.trigger.payload
      } else {
        // TODO: handle android payload deeplink
      }
      if (payload) {
        logger.debug(
          'Notifications: received payload',
          payload,
          logger.DebugContext.notifications,
        )
        // TODO: deeplink notif here
      }
    }
  })

  // handle notifications that are tapped on
  Notifications.addNotificationResponseReceivedListener(response => {
    logger.debug(
      'Notifications: response received',
      {
        actionIdentifier: response.actionIdentifier,
      },
      logger.DebugContext.notifications,
    )
    if (response.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
      logger.debug(
        'User pressed a notification, opening notifications tab',
        {},
        logger.DebugContext.notifications,
      )
      track('Notificatons:OpenApp')
      truncateAndInvalidate(queryClient, RQKEY_NOTIFS())
      resetToTab('NotificationsTab') // open notifications tab
    }
  })
}
