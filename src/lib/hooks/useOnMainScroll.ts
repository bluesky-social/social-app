import {useState} from 'react'
import {NativeSyntheticEvent, NativeScrollEvent} from 'react-native'
import {RootStoreModel} from 'state/index'

export type onMomentumScrollEndCb = (
  event: NativeSyntheticEvent<NativeScrollEvent>,
) => void
export type OnScrollCb = (
  event: NativeSyntheticEvent<NativeScrollEvent>,
) => void

export function useOnMainScroll(store: RootStoreModel) {
  let [lastY, setLastY] = useState(0)
  let isMinimal = store.shell.minimalShellMode
  return function onMainScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const y = event.nativeEvent.contentOffset.y
    const dy = y - (lastY || 0)
    setLastY(y)

    if (!isMinimal && y > 10 && dy > 10) {
      store.shell.setMinimalShellMode(true)
      isMinimal = true
    } else if (isMinimal && (y <= 10 || dy < -10)) {
      store.shell.setMinimalShellMode(false)
      isMinimal = false
    }
  }
}
