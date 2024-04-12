import {useCallback, useEffect} from 'react'
import {AppState} from 'react-native'
import * as Updates from 'expo-updates'

import {logger} from '#/logger'

export function useOTAUpdate() {
  // HELPER FUNCTIONS
  const checkForUpdate = useCallback(async () => {
    logger.debug('useOTAUpdate: Checking for update...')
    try {
      // Check if new OTA update is available
      const update = await Updates.checkForUpdateAsync()
      // If updates aren't available stop the function execution
      if (!update.isAvailable) {
        return
      }
      // Otherwise fetch the update in the background, so even if the user rejects switching to latest version it will be done automatically on next relaunch.
      await Updates.fetchUpdateAsync()
    } catch (e) {
      logger.error('useOTAUpdate: Error while checking for update', {
        message: e,
      })
    }
  }, [])
  const updateEventListener = useCallback((event: Updates.UpdateEvent) => {
    logger.debug('useOTAUpdate: Listening for update...')
    if (event.type === Updates.UpdateEventType.ERROR) {
      logger.error('useOTAUpdate: Error while listening for update', {
        message: event.message,
      })
    } else if (event.type === Updates.UpdateEventType.NO_UPDATE_AVAILABLE) {
      // Handle no update available
      // do nothing
    } else if (event.type === Updates.UpdateEventType.UPDATE_AVAILABLE) {
      // Handle update available
      // open modal, ask for user confirmation, and reload the app
    }
  }, [])

  useEffect(() => {
    // ADD EVENT LISTENERS
    const updateEventSubscription = Updates.addListener(updateEventListener)
    const appStateSubscription = AppState.addEventListener('change', state => {
      if (state === 'active' && !__DEV__) {
        checkForUpdate()
      }
    })

    // REMOVE EVENT LISTENERS (CLEANUP)
    return () => {
      updateEventSubscription.remove()
      appStateSubscription.remove()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  // disable exhaustive deps because we don't want to run this effect again
}
