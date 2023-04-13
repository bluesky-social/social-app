import * as Updates from 'expo-updates'
import {useStores} from 'state/index'

export function useOTAUpdate() {
  const store = useStores()
  const upadateEventListener = async (event: Updates.UpdateEvent) => {
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
          await Updates.reloadAsync()
        },
      })
    }
  }

  Updates.useUpdateEvents(upadateEventListener)
}
