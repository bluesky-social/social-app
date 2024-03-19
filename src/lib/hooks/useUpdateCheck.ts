import React from 'react'
import {Alert, AppState, AppStateStatus} from 'react-native'
import * as Updates from 'expo-updates'
import {useUpdates} from 'expo-updates'
import {logger} from '#/logger'
import {IS_TESTFLIGHT} from '#/env'
import app from 'react-native-version-number'

export function useUpdateCheck() {
  const appState = React.useRef<AppStateStatus>('active')
  const lastMinimize = React.useRef(0)
  const ranInitialCheck = React.useRef(false)
  const timeout = React.useRef<NodeJS.Timeout>()
  const {isUpdatePending} = useUpdates()

  const setCheckTimeout = React.useCallback(() => {
    timeout.current = setTimeout(async () => {
      try {
        await Updates.setExtraParamAsync(
          'buildNumber',
          app.buildVersion.toString(),
        )
        await Updates.setExtraParamAsync(
          'channel',
          IS_TESTFLIGHT ? 'testflight' : 'production',
        )

        logger.debug('Checking for update...')
        const res = await Updates.checkForUpdateAsync()

        if (!res.isAvailable) {
          logger.debug('No update available.')
          return
        }

        logger.debug('Attempting to fetch update...')
        await Updates.fetchUpdateAsync()
        logger.debug('Successfully fetched update')
      } catch (e) {
        logger.warn('OTA Update Error', {error: `${e}`})
      }
    }, 15e3)
  }, [])

  React.useEffect(() => {
    // For Testflight users, we can prompt the user to update immediately whenever there's an available update. This
    // is suspect however with the Apple App Store guidelines, so we don't want to prompt production users to update
    // immediately.
    if (IS_TESTFLIGHT) {
      ;(async () => {
        await Updates.setExtraParamAsync(
          'buildNumber',
          app.buildVersion.toString(),
        )
        await Updates.setExtraParamAsync(
          'channel',
          IS_TESTFLIGHT ? 'testflight' : 'production',
        )

        const res = await Updates.checkForUpdateAsync()
        if (res.isAvailable) {
          await Updates.fetchUpdateAsync()

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
                  await Updates.reloadAsync()
                },
              },
            ],
          )
        } else {
          Alert.alert(
            'No Update Available',
            'No update available at this time.',
          )
        }
      })()
      return
    }
    if (__DEV__ || ranInitialCheck.current) {
      return
    }

    setCheckTimeout()
    ranInitialCheck.current = true
  }, [setCheckTimeout])

  // After the app has been minimized for 30 minutes, we want to either A. install an update if one has become available
  // or B check for an update again.
  React.useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      async nextAppState => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === 'active'
        ) {
          // If it's been 30 minutes since the last "minimize", we should feel comfortable updating the client now if
          // necessary, otherwise we can check for another update.
          if (lastMinimize.current <= Date.now() - 30 * 60e3) {
            if (isUpdatePending) {
              await Updates.reloadAsync()
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
