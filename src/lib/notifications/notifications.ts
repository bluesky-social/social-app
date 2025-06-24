import React from 'react'
import {Platform} from 'react-native'
import * as Notifications from 'expo-notifications'
import {getBadgeCountAsync, setBadgeCountAsync} from 'expo-notifications'
import {type AtpAgent} from '@atproto/api'
import debounce from 'lodash.debounce'

import {Logger} from '#/logger'
import {isNative} from '#/platform/detection'
import {type SessionAccount, useAgent, useSession} from '#/state/session'
import BackgroundNotificationHandler from '../../../modules/expo-background-notification-handler'

const logger = Logger.create(Logger.Context.Notifications)

/**
 * Registers the device's push notification token with the Bluesky server.
 */
async function _registerPushToken(
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

    logger.debug(`registerPushToken: success`, {
      tokenType: token.type,
      token: token.data,
    })
  } catch (error) {
    logger.error(`registerPushToken: failed`, {safeMessage: error})
  }
}

/**
 * Debounced version of `_registerPushToken` to prevent multiple calls. Use this
 * instead of using `_registerPushToken` directly.
 */
const registerPushToken = debounce(_registerPushToken, 100)

/**
 * Retreive the device's push notification token, if permissions are granted.
 */
async function getPushToken() {
  const granted = (await Notifications.getPermissionsAsync()).granted
  logger.debug(`getPushToken`, {granted})
  if (granted) {
    return Notifications.getDevicePushTokenAsync()
  }
}

/**
 * Gets the device push token and registers it with the Bluesky server.
 *
 * N.B. A previous regression in `expo-notifications` caused
 * `addPushTokenListener` to not fire on Android after calling
 * `getPushToken()`. Therefore, as insurance, we also call
 * `registerPushToken` here.
 *
 * Because `registerPushToken` is debounced, we can safely call it on every
 * platform and only a single call will be made to the server.
 *
 * @see https://github.com/bluesky-social/social-app/pull/4467
 * @see https://github.com/expo/expo/issues/28656
 * @see https://github.com/expo/expo/issues/29909
 */
export async function getAndRegisterPushToken(
  agent: AtpAgent,
  currentAccount: SessionAccount,
) {
  try {
    /**
     * This will also fire the listener added via `addPushTokenListener`. That
     * listener also handles registration.
     */
    const token = await getPushToken()

    logger.debug(`getAndRegisterPushToken`, {token: token ?? 'undefined'})

    if (token) {
      /**
       * The listener should have registered the token already, but just in
       * case, call the debounced function again.
       */
      registerPushToken(agent, currentAccount, token)
    }

    return token
  } catch (e: any) {
    logger.error(`getPushToken: failed`, {safeMessage: e.message})
  }
}

/**
 * Hook to register the device's push notification token with the Bluesky
 * server, as well as listen for push token updates, should they occurr.
 *
 * Registered via the shell, which wraps the navigation stack, meaning if we
 * have a current account, this handling will be registered and ready to go.
 */
export function useNotificationsRegistration() {
  const agent = useAgent()
  const {currentAccount} = useSession()

  React.useEffect(() => {
    if (!currentAccount) return

    logger.debug(`useNotificationsRegistration`)

    /**
     * Init push token, if permissions are granted already. If they weren't,
     * they'll be requested by the `useRequestNotificationsPermission` hook
     * below.
     */
    getAndRegisterPushToken(agent, currentAccount)

    /**
     * According to the Expo docs, there is a chance that the token will change
     * while the app is open in some rare cases. This will fire
     * `registerPushToken` whenever that happens.
     *
     * @see https://docs.expo.dev/versions/latest/sdk/notifications/#addpushtokenlistenerlistener
     */
    const subscription = Notifications.addPushTokenListener(async newToken => {
      registerPushToken(agent, currentAccount, newToken)
      logger.debug(`addPushTokenListener callback`, {newToken})
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
      /**
       * Load bearing. The `addPushTokenListener` will be registered by the
       * time this runs, and this should fire that listener automatically to
       * register the token with our server. If for some reason it does not, we
       * have a fallback below. See above for more info.
       */
      const token = await getPushToken()

      /**
       * This call is our insurance policy in case `addPushTokenListener`
       * didn't fire as a result of `getPushToken`. See comments above for more
       * details.
       *
       * Right after login, `currentAccount` in this scope will be undefined,
       * hence the guard here. For other callsites, it should be defined
       * already.
       */
      if (token && currentAccount) {
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
