import {BackHandler} from 'react-native'
import {RootStoreModel} from 'state/index'

export function init(store: RootStoreModel) {
  BackHandler.addEventListener('hardwareBackPress', () => {
    return store.shell.closeAnyActiveElement()
  })
}
