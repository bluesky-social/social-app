import * as Notifications from 'expo-notifications'
import {BskyAgent} from '@atproto/api'

import {logger} from '#/logger'
import {SessionAccount} from '#/state/session'
import {devicePlatform} from 'platform/detection'

const SERVICE_DID = (serviceUrl?: string) =>
  serviceUrl?.includes('staging')
    ? 'did:web:api.staging.bsky.dev'
    : 'did:web:api.bsky.app'

export async function requestPermissionsAndRegisterToken(
  getAgent: () => BskyAgent,
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
  getAgent: () => BskyAgent,
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
