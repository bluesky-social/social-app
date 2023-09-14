import {isAndroid} from 'platform/detection'
import {BackHandler} from 'react-native'
import {RootStoreModel} from 'state/index'

export function init(store: RootStoreModel) {
  // only register back handler on android, otherwise it throws an error
  if (isAndroid) {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        return store.shell.closeAnyActiveElement()
      },
    )
    return () => {
      backHandler.remove()
    }
  }
  return () => {}
}
