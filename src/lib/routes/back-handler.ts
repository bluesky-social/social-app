import {BackHandler} from 'react-native'
import {RootStoreModel} from 'state/index'

export function onBack(cb: () => boolean): () => void {
  const subscription = BackHandler.addEventListener('hardwareBackPress', cb)
  return () => subscription.remove()
}

export function init(store: RootStoreModel) {
  onBack(() => store.shell.closeAnyActiveElement())
}
