import {useCallback, useEffect} from 'react'
import {Platform} from 'react-native'
import * as Notifications from 'expo-notifications'
import {getBadgeCountAsync, setBadgeCountAsync} from 'expo-notifications'
import {type AppBskyNotificationRegisterPush, type AtpAgent} from '@atproto/api'
import debounce from 'lodash.debounce'

import {PUBLIC_APPVIEW_DID, PUBLIC_STAGING_APPVIEW_DID} from '#/lib/constants'
import {logger as notyLogger} from '#/lib/notifications/util'
import {isNative} from '#/platform/detection'
import {useAgeAssuranceContext} from '#/state/ageAssurance'
import {type SessionAccount, useAgent, useSession} from '#/state/session'
import BackgroundNotificationHandler from '#/../modules/expo-background-notification-handler'
import {IS_DEV} from '#/env'

/**
 * @private
 * Registers the device's push notification token with the Bluesky server.
 */
async function _registerPushToken({
  agent,
  currentAccount,
  token,
  extra = {},
}: {
  agent: AtpAgent
  currentAccount: SessionAccount
  token: Notifications.DevicePushToken
  extra?: {
    ageRestricted?: boolean
  }
}) {
  try {
    const payload: AppBskyNotificationRegisterPush.InputSchema = {
      serviceDid: currentAccount.service?.includes('staging')
        ? PUBLIC_STAGING_APPVIEW_DID
        : PUBLIC_APPVIEW_DID,
      platform: Platform.OS,
      token: token.data,
      appId: 'xyz.blueskyweb.app',
      ageRestricted: extra.ageRestricted ?? false,
    }

    notyLogger.debug(`registerPushToken: registering`, {...payload})

    await agent.app.bsky.notification.registerPush(payload)

    notyLogger.debug(`registerPushToken: success`)
  } catch (error) {
    notyLogger.error(`registerPushToken: failed`, {safeMessage: error})
  }
}

/**
 * @private
 * Debounced version of `_registerPushToken` to prevent multiple calls.
 */
const _registerPushTokenDebounced = debounce(_registerPushToken, 100)

/**
 * Hook to register the device's push notification token with the Bluesky. If
 * the user is not logged in, this will do nothing.
 *
 * Use this instead of using `_registerPushToken` or
 * `_registerPushTokenDebounced` directly.
 */
export function useRegisterPushToken() {
  const agent = useAgent()
  const {currentAccount} = useSession()

  return useCallback(
    ({
      token,
      isAgeRestricted,
    }: {
      token: Notifications.DevicePushToken
      isAgeRestricted: boolean
    }) => {
      if (!currentAccount) return
      return _registerPushTokenDebounced({
        agent,
        currentAccount,
        token,
        extra: {
          ageRestricted: isAgeRestricted,
        },
      })
    },
    [agent, currentAccount],
  )
}

/**
 * Retreive the device's push notification token, if permissions are granted.
 */
async function getPushToken() {
  const granted = (await Notifications.getPermissionsAsync()).granted
  notyLogger.debug(`getPushToken`, {granted})
  if (granted) {
    return Notifications.getDevicePushTokenAsync()
  }
}

/**
 * Hook to get the device push token and register it with the Bluesky server.
 * Should only be called after a user has logged-in, since registration is an
 * authed endpoint.
 *
 * N.B. A previous regression in `expo-notifications` caused
 * `addPushTokenListener` to not fire on Android after calling
 * `getPushToken()`. Therefore, as insurance, we also call
 * `registerPushToken` here.
 *
 * Because `registerPushToken` is debounced, even if the the listener _does_
 * fire, it's OK to also call `registerPushToken` below since only a single
 * call will be made to the server (ideally). This does race the listener (if
 * it fires), so there's a possibility that multiple calls will be made, but
 * that is acceptable.
 *
 * @see https://github.com/expo/expo/issues/28656
 * @see https://github.com/expo/expo/issues/29909
 * @see https://github.com/bluesky-social/social-app/pull/4467
 */
export function useGetAndRegisterPushToken() {
  const {isAgeRestricted} = useAgeAssuranceContext()
  const registerPushToken = useRegisterPushToken()
  return useCallback(
    async ({
      isAgeRestricted: isAgeRestrictedOverride,
    }: {
      isAgeRestricted?: boolean
    } = {}) => {
      if (!isNative || IS_DEV) return

      /**
       * This will also fire the listener added via `addPushTokenListener`. That
       * listener also handles registration.
       */
      const token = await getPushToken()

      notyLogger.debug(`useGetAndRegisterPushToken`, {
        token: token ?? 'undefined',
      })

      if (token) {
        /**
         * The listener should have registered the token already, but just in
         * case, call the debounced function again.
         */
        registerPushToken({
          token,
          isAgeRestricted: isAgeRestrictedOverride ?? isAgeRestricted,
        })
      }

      return token
    },
    [registerPushToken, isAgeRestricted],
  )
}

/**
 * Hook to register the device's push notification token with the Bluesky
 * server, as well as listen for push token updates, should they occurr.
 *
 * Registered via the shell, which wraps the navigation stack, meaning if we
 * have a current account, this handling will be registered and ready to go.
 */
export function useNotificationsRegistration() {
  const {currentAccount} = useSession()
  const registerPushToken = useRegisterPushToken()
  const getAndRegisterPushToken = useGetAndRegisterPushToken()
  const {isReady: isAgeRestrictionReady, isAgeRestricted} =
    useAgeAssuranceContext()

  useEffect(() => {
    /**
     * We want this to init right away _after_ we have a logged in user, and
     * _after_ we've loaded their age assurance state.
     */
    if (!currentAccount || !isAgeRestrictionReady) return

    notyLogger.debug(`useNotificationsRegistration`)

    /**
     * Init push token, if permissions are granted already. If they weren't,
     * they'll be requested by the `useRequestNotificationsPermission` hook
     * below.
     */
    getAndRegisterPushToken()

    /**
     * Register the push token with the Bluesky server, whenever it changes.
     * This is also fired any time `getDevicePushTokenAsync` is called.
     *
     * Since this is registered immediately after `getAndRegisterPushToken`, it
     * should also detect that getter and be fired almost immediately after this.
     *
     * According to the Expo docs, there is a chance that the token will change
     * while the app is open in some rare cases. This will fire
     * `registerPushToken` whenever that happens.
     *
     * @see https://docs.expo.dev/versions/latest/sdk/notifications/#addpushtokenlistenerlistener
     */
    const subscription = Notifications.addPushTokenListener(async token => {
      registerPushToken({token, isAgeRestricted: isAgeRestricted})
      notyLogger.debug(`addPushTokenListener callback`, {token})
    })

    return () => {
      subscription.remove()
    }
  }, [
    currentAccount,
    getAndRegisterPushToken,
    registerPushToken,
    isAgeRestrictionReady,
    isAgeRestricted,
  ])
}

export function useRequestNotificationsPermission() {
  const {currentAccount} = useSession()
  const getAndRegisterPushToken = useGetAndRegisterPushToken()

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

    notyLogger.metric(`notifications:request`, {
      context: context,
      status: res.status,
    })

    if (res.granted) {
      if (currentAccount) {
        /**
         * If we have an account in scope, we can safely call
         * `getAndRegisterPushToken`.
         */
        getAndRegisterPushToken()
      } else {
        /**
         * Right after login, `currentAccount` in this scope will be undefined,
         * but calling `getPushToken` will result in `addPushTokenListener`
         * listeners being called, which will handle the registration with the
         * Bluesky server.
         */
        getPushToken()
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
