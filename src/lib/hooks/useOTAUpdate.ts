import * as Updates from 'expo-updates'
import {useEffect} from 'react'
import {AppState} from 'react-native'
import {useStores} from 'state/index'

export function useOTAUpdate() {
  console.log('OTA Update: Checking for update...')
  const store = useStores()

  useEffect(() => {
    // HELPER FUNCTIONS
    function showUpdatePopup() {
      store.shell.openModal({
        name: 'confirm',
        title: 'Update Available',
        message:
          'A new version of the app is available. Please update to continue using the app.',
        onPressConfirm: async () => {
          Updates.reloadAsync().catch(err => {
            throw err
          })
        },
      })
    }
    async function checkForUpdate() {
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
        console.error('OTA Update: Error while checking for update', e)
      }
    }
    function updateEventListener(event: Updates.UpdateEvent) {
      if (event.type === Updates.UpdateEventType.ERROR) {
        throw new Error(event.message)
      } else if (event.type === Updates.UpdateEventType.NO_UPDATE_AVAILABLE) {
        // Handle no update available
        // do nothing
      } else if (event.type === Updates.UpdateEventType.UPDATE_AVAILABLE) {
        // Handle update available
        // open modal, ask for user confirmation, and reload the app
        showUpdatePopup()
      }
    }

    // ADD EVENT LISTENERS
    const updateEventSubscription = Updates.addListener(updateEventListener)
    const appStateSubscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
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
