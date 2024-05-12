import React from 'react'
import * as Notifications from 'expo-notifications'
import {BskyAgent} from '@atproto/api'

import {logger} from '#/logger'
import {SessionAccount, useAgent, useSession} from '#/state/session'
import {devicePlatform} from 'platform/detection'

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
      currentPermissions?.status !== 'granted' ||
      !currentAccount ||
      prevAccountDid.current === currentAccount.did
    ) {
      return
    }

    registerPushToken(getAgent, currentAccount)

    const subscription = Notifications.addPushTokenListener(() => {
      registerPushToken(getAgent, currentAccount)
    })

    return () => {
      subscription.remove()
    }
  }, [currentAccount, currentPermissions, getAgent])
}
