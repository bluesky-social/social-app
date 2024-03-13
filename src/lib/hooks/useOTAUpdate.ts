import * as Updates from 'expo-updates'
import {useCallback, useEffect} from 'react'
import {AppState} from 'react-native'
import {logger} from '#/logger'
import {useModalControls} from '#/state/modals'
import {t} from '@lingui/macro'

export function useOTAUpdate() {
  const {openModal} = useModalControls()

  // HELPER FUNCTIONS
  const showUpdatePopup = useCallback(() => {
    openModal({
      name: 'confirm',
      title: t`Update Available`,
      message: t`A new version of the app is available. Please update to continue using the app.`,
      onPressConfirm: async () => {
        Updates.reloadAsync().catch(err => {
          throw err
        })
      },
    })
  }, [openModal])
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
      // show a popup modal
      showUpdatePopup()
    } catch (e) {
      logger.error('useOTAUpdate: Error while checking for update', {
        message: e,
      })
    }
  }, [showUpdatePopup])
  const updateEventListener = useCallback(
    (event: Updates.UpdateEvent) => {
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
        showUpdatePopup()
      }
    },
    [showUpdatePopup],
  )

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
