import {clearInterval} from 'node:timers'

import React from 'react'
import {Alert, AppState, AppStateStatus} from 'react-native'
import {nativeBuildVersion} from 'expo-application'
import {
  checkForUpdateAsync,
  fetchUpdateAsync,
  isEnabled,
  reloadAsync,
  setExtraParamAsync,
  useUpdates,
} from 'expo-updates'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {logger} from '#/logger'
import {IS_TESTFLIGHT} from 'lib/app-info'
import {isIOS} from 'platform/detection'
import {useSession} from 'state/session'
import {useIsComposerOpen} from 'state/shell/composer'

const MINIMUM_MINIMIZE_TIME = 10 * 60e3

async function setExtraParams() {
  await setExtraParamAsync(
    isIOS ? 'ios-build-number' : 'android-build-number',
    // Hilariously, `buildVersion` is not actually a string on Android even though the TS type says it is.
    // This just ensures it gets passed as a string
    `${nativeBuildVersion}`,
  )
  await setExtraParamAsync(
    'channel',
    IS_TESTFLIGHT ? 'testflight' : 'production',
  )
}

export function useOTAUpdates() {
  const {_} = useLingui()
  const {currentAccount} = useSession()

  const shouldReceiveUpdates = isEnabled && !__DEV__

  const appState = React.useRef<AppStateStatus>('active')
  const lastMinimize = React.useRef(0)
  const ranInitialCheck = React.useRef(false)
  const alertedUser = React.useRef(false)
  const {isUpdatePending, isDownloading, downloadedUpdate} = useUpdates()
  const isComposerOpen = useIsComposerOpen()

  const checkForUpdate = React.useCallback(async () => {
    if (isDownloading) return
    try {
      await setExtraParams()

      logger.debug('Checking for update...')
      const res = await checkForUpdateAsync()

      if (res.isAvailable) {
        logger.debug('Attempting to fetch update...')
        await fetchUpdateAsync()
      } else {
        logger.debug('No update available.')
      }
    } catch (e) {
      logger.error('OTA Update Error', {error: `${e}`})
    }
  }, [isDownloading])

  // Run the initial check. This happens immediately after launch.
  React.useEffect(() => {
    if (!shouldReceiveUpdates || ranInitialCheck.current) {
      return
    }
    checkForUpdate()
    ranInitialCheck.current = true
  }, [checkForUpdate, shouldReceiveUpdates])

  React.useEffect(() => {
    if (!shouldReceiveUpdates) return

    // Check for an update every 10 minutes
    let checkInterval: NodeJS.Timer
    const setCheckInterval = () => {
      checkInterval = setInterval(() => {
        checkForUpdate()
      }, 10 * 60e3)
    }

    // Check for an update whenver coming back to the app after being minimized for 10 minutes, or install the update
    // if one is available
    const subscription = AppState.addEventListener(
      'change',
      async nextAppState => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === 'active'
        ) {
          // If it's been 15 minutes since the last "minimize", we should feel comfortable updating the client since
          // chances are that there isn't anything important going on in the current session.
          if (lastMinimize.current <= Date.now() - MINIMUM_MINIMIZE_TIME) {
            if (isUpdatePending) {
              await reloadAsync()
            } else {
              checkForUpdate()
            }
          }
          setCheckInterval()
        } else {
          clearInterval(checkInterval)
          lastMinimize.current = Date.now()
        }

        appState.current = nextAppState
      },
    )

    return () => {
      clearInterval(checkInterval)
      subscription.remove()
    }
  }, [checkForUpdate, isUpdatePending, shouldReceiveUpdates])

  React.useEffect(() => {
    // We only want to alert once per app session. We'll tell them once they finish composing instead.
    if (!downloadedUpdate || alertedUser.current) return

    // Don't interrupt the user while composing a post
    if (isComposerOpen) return

    alertedUser.current = true

    // If there wasn't an account loaded when the download completed, don't ever alert the user. This is their first
    // time using the app, i.e. a new onboard.
    if (!currentAccount) {
      return
    }

    const timeout = setTimeout(() => {
      Alert.alert(
        _(msg`An Update is Available!`),
        _(
          msg`There's an update waiting to be installed. Would you like to relaunch the app and install it now?`,
        ),
        [
          {
            text: _(msg`No`),
            style: 'cancel',
          },
          {
            text: _(msg`Relaunch now`),
            style: 'default',
            onPress: async () => {
              await reloadAsync()
            },
          },
        ],
      )
    }, 5e3)

    return () => {
      clearTimeout(timeout)
    }
  }, [_, downloadedUpdate, currentAccount, isComposerOpen])
}
