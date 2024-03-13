import React from 'react'
import {AppState, AppStateStatus} from 'react-native'
import * as Updates from 'expo-updates'
import {useUpdates} from 'expo-updates'
import {logger} from '#/logger'

export function useUpdateCheck() {
  const appState = React.useRef<AppStateStatus>('active')
  const lastMinimize = React.useRef(0)
  const timeout = React.useRef<NodeJS.Timeout>()
  const {isUpdatePending} = useUpdates()

  const setCheckTimeout = React.useRef(() => {
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
  }).current

  // This doesn't need to handle updates on app launch. expo-updates will handle that on its own. The only thing
  // we have to handle here is checking for new updates on an interval and installing those updates after a 30 minute
  // period of being outside the app.
  React.useEffect(() => {
    if (__DEV__) return

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
