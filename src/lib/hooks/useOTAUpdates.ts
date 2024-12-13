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

import {IS_TESTFLIGHT} from '#/lib/app-info'
import {logger} from '#/logger'
import {isIOS} from '#/platform/detection'

const MINIMUM_MINIMIZE_TIME = 15 * 60e3

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
  const shouldReceiveUpdates = isEnabled && !__DEV__

  const appState = React.useRef<AppStateStatus>('active')
  const lastMinimize = React.useRef(0)
  const ranInitialCheck = React.useRef(false)
  const timeout = React.useRef<NodeJS.Timeout>()
  const {isUpdatePending} = useUpdates()

  const setCheckTimeout = React.useCallback(() => {
    timeout.current = setTimeout(async () => {
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
    }, 10e3)
  }, [])

  const onIsTestFlight = React.useCallback(async () => {
    try {
      await setExtraParams()

      const res = await checkForUpdateAsync()
      if (res.isAvailable) {
        await fetchUpdateAsync()

        Alert.alert(
          'Update Available',
          'A new version of the app is available. Relaunch now?',
          [
            {
              text: 'No',
              style: 'cancel',
            },
            {
              text: 'Relaunch',
              style: 'default',
              onPress: async () => {
                await reloadAsync()
              },
            },
          ],
        )
      }
    } catch (e: any) {
      logger.error('Internal OTA Update Error', {error: `${e}`})
    }
  }, [])

  React.useEffect(() => {
    // We use this setTimeout to allow Statsig to initialize before we check for an update
    // For Testflight users, we can prompt the user to update immediately whenever there's an available update. This
    // is suspect however with the Apple App Store guidelines, so we don't want to prompt production users to update
    // immediately.
    if (IS_TESTFLIGHT) {
      onIsTestFlight()
      return
    } else if (!shouldReceiveUpdates || ranInitialCheck.current) {
      return
    }

    setCheckTimeout()
    ranInitialCheck.current = true
  }, [onIsTestFlight, setCheckTimeout, shouldReceiveUpdates])

  // After the app has been minimized for 15 minutes, we want to either A. install an update if one has become available
  // or B check for an update again.
  React.useEffect(() => {
    if (!isEnabled) return

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
              setCheckTimeout()
            }
          }
        } else {
          lastMinimize.current = Date.now()
        }

        appState.current = nextAppState
      },
    )

    return () => {
      clearTimeout(timeout.current)
      subscription.remove()
    }
  }, [isUpdatePending, setCheckTimeout])
}
