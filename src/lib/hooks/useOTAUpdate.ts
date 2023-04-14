import * as Updates from 'expo-updates'
import {useStores} from 'state/index'

export function useOTAUpdate() {
  console.log('OTA Update: Checking for update...')
  const store = useStores()
  const upadateEventListener = (event: Updates.UpdateEvent) => {
    if (event.type === Updates.UpdateEventType.ERROR) {
      throw new Error(event.message)
    } else if (event.type === Updates.UpdateEventType.NO_UPDATE_AVAILABLE) {
      // Handle no update available
      // do nothing
    } else if (event.type === Updates.UpdateEventType.UPDATE_AVAILABLE) {
      // Handle update available
      // open modal, ask for user confirmation, and reload the app
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
  }

  Updates.useUpdateEvents(upadateEventListener)
}
