import React from 'react'
import {AppState, AppStateStatus} from 'react-native'
import * as Updates from 'expo-updates'
import {useUpdates} from 'expo-updates'
import {logger} from '#/logger'

export function useUpdateCheck() {
  const appState = React.useRef<AppStateStatus>('active')
  const lastMinimize = React.useRef(0)
  const ranInitialCheck = React.useRef(false)
  const timeout = React.useRef<NodeJS.Timeout>()
  const {isUpdatePending} = useUpdates()

  const setCheckTimeout = React.useCallback(() => {
    timeout.current = setTimeout(async () => {
      try {
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

  // This effect runs only on the first app launch. The ref is probably unnecessary but incase of any strange
  // things possibly in the simulator (shouldn't happen with __DEV__ but just in case) it won't run more than
  // once
  React.useEffect(() => {
    if (__DEV__ || ranInitialCheck.current) return
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
