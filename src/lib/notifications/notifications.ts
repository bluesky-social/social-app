import React from 'react'
import * as Notifications from 'expo-notifications'
import {BskyAgent} from '@atproto/api'

import {logger} from '#/logger'
import {SessionAccount, useAgent, useSession} from '#/state/session'
import {logEvent} from 'lib/statsig/statsig'
import {devicePlatform, isNative} from 'platform/detection'

const SERVICE_DID = (serviceUrl?: string) =>
  serviceUrl?.includes('staging')
    ? 'did:web:api.staging.bsky.dev'
    : 'did:web:api.bsky.app'

async function registerPushToken(
  getAgent: () => BskyAgent,
  account: SessionAccount,
) {
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

export function useNotificationsRegistration() {
  const [currentPermissions] = Notifications.usePermissions()
  const {getAgent} = useAgent()
  const {currentAccount} = useSession()

  const prevAccountDid = React.useRef<string | undefined>(undefined)

  React.useEffect(() => {
    if (
      !currentPermissions?.granted ||
      !currentAccount ||
      prevAccountDid.current === currentAccount.did
    ) {
      return
    }

    registerPushToken(getAgent, currentAccount)

    // According to the Expo docs, there is a chance that the token will change while the app is open in some rare
    // cases. This will fire `registerPushToken` whenever that happens.
    const subscription = Notifications.addPushTokenListener(() => {
      registerPushToken(getAgent, currentAccount)
    })

    return () => {
      subscription.remove()
    }
  }, [currentAccount, currentPermissions, getAgent])
}

export function useNotificationsPermissionRequest() {
  const [currentPermissions] = Notifications.usePermissions()

  return React.useCallback(
    async (context: 'StartOnboarding' | 'AfterOnboarding') => {
      if (!isNative || currentPermissions?.granted) {
        return
      }

      const res = await Notifications.requestPermissionsAsync()
      logEvent('notifications:request', {
        logContext: context,
        status: res.status,
      })
    },
    [currentPermissions],
  )
}
