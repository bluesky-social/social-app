import React from 'react'
import {Platform} from 'react-native'
import * as Notifications from 'expo-notifications'
import {getBadgeCountAsync, setBadgeCountAsync} from 'expo-notifications'
import {type AtpAgent} from '@atproto/api'

import {Logger} from '#/logger'
import {isAndroid, isNative} from '#/platform/detection'
import {type SessionAccount, useAgent, useSession} from '#/state/session'
import BackgroundNotificationHandler from '../../../modules/expo-background-notification-handler'

const logger = Logger.create(Logger.Context.Notifications)

async function registerPushToken(
  agent: AtpAgent,
  account: SessionAccount,
  token: Notifications.DevicePushToken,
) {
  try {
    await agent.app.bsky.notification.registerPush({
      serviceDid: account.service?.includes('staging')
        ? 'did:web:api.staging.bsky.dev'
        : 'did:web:api.bsky.app',
      platform: Platform.select({
        ios: 'ios',
        android: 'android',
        default: 'web',
      }),
      token: token.data,
      appId: 'xyz.blueskyweb.app',
    })

    logger.debug(`registerPushToken`, {
      tokenType: token.type,
      token: token.data,
    })
  } catch (error) {
    logger.error(`registerPushToken: failed`, {safeMessage: error})
  }
}

async function getPushToken(skipPermissionCheck = false) {
  const granted =
    skipPermissionCheck || (await Notifications.getPermissionsAsync()).granted
  if (granted) {
    return Notifications.getDevicePushTokenAsync()
  }
}

export function useNotificationsRegistration() {
  const agent = useAgent()
  const {currentAccount} = useSession()

  React.useEffect(() => {
    if (!currentAccount) return

    /**
     * HACK — An apparent regression in expo-notifications causes
     * `addPushTokenListener` to not fire on Android whenever the token changes
     * by calling `getPushToken()`. This is a workaround to ensure we register
     * the token once it is generated on Android.
     *
     * @see https://github.com/bluesky-social/social-app/pull/4467
     */
    if (isAndroid) {
      ;(async () => {
        const token = await getPushToken()

        // Token will be undefined if we don't have notifications permission
        if (token) {
          registerPushToken(agent, currentAccount, token)
        }
      })()
    } else {
      getPushToken()
    }

    /*
     * According to the Expo docs, there is a chance that the token will change
     * while the app is open in some rare cases. This will fire
     * `registerPushToken` whenever that happens.
     */
    const subscription = Notifications.addPushTokenListener(async newToken => {
      registerPushToken(agent, currentAccount, newToken)
    })

    return () => {
      subscription.remove()
    }
  }, [currentAccount, agent])
}

export function useRequestNotificationsPermission() {
  const {currentAccount} = useSession()
  const agent = useAgent()

  return async (
    context: 'StartOnboarding' | 'AfterOnboarding' | 'Login' | 'Home',
  ) => {
    const permissions = await Notifications.getPermissionsAsync()

    if (
      !isNative ||
      permissions?.status === 'granted' ||
      (permissions?.status === 'denied' && !permissions.canAskAgain)
    ) {
      return
    }
    if (context === 'AfterOnboarding') {
      return
    }
    if (context === 'Home' && !currentAccount) {
      return
    }

    const res = await Notifications.requestPermissionsAsync()
    logger.metric(`notifications:request`, {
      context: context,
      status: res.status,
    })

    if (res.granted) {
      /*
       * This will fire a pushTokenEvent, which will handle registration of the
       * token
       */
      const token = await getPushToken(true)

      /**
       * Same hack as above. We cannot rely on the `addPushTokenListener` to
       * fire on Android due to an Expo bug, so we will manually register it
       * here. Note that this will occur only:
       *
       *    1) Right after the user signs in, leading to no `currentAccount`
       *    account being available - this will be instead picked up from the
       *    useEffect above on `currentAccount` change
       *
       *    2) Right after onboarding. In this case, we _need_ this
       *    registration, since `currentAccount` will not change and we need to
       *    ensure the token is registered right after permission is granted.
       *    `currentAccount` will already be available in this case, so the
       *    registration will succeed. We should remove this once
       *    expo-notifications (and possibly FCMv1) is fixed and the
       *    `addPushTokenListener` is working again.
       *
       * @see https://github.com/expo/expo/issues/28656
       */
      if (isAndroid && currentAccount && token) {
        registerPushToken(agent, currentAccount, token)
      }
    }
  }
}

export async function decrementBadgeCount(by: number) {
  if (!isNative) return

  let count = await getBadgeCountAsync()
  count -= by
  if (count < 0) {
    count = 0
  }

  await BackgroundNotificationHandler.setBadgeCountAsync(count)
  await setBadgeCountAsync(count)
}

export async function resetBadgeCount() {
  await BackgroundNotificationHandler.setBadgeCountAsync(0)
  await setBadgeCountAsync(0)
}
