import {useState, useCallback, useRef} from 'react'
import {NativeSyntheticEvent, NativeScrollEvent} from 'react-native'
import {RootStoreModel} from 'state/index'
import {s} from 'lib/styles'

export type OnScrollCb = (
  event: NativeSyntheticEvent<NativeScrollEvent>,
) => void
export type ResetCb = () => void

export function useOnMainScroll(
  store: RootStoreModel,
): [OnScrollCb, boolean, ResetCb] {
  let lastY = useRef(0)
  let [isScrolledDown, setIsScrolledDown] = useState(false)
  return [
    useCallback(
      (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const y = event.nativeEvent.contentOffset.y
        const dy = y - (lastY.current || 0)
        lastY.current = y

        if (!store.shell.minimalShellMode && y > 10 && dy > 10) {
          store.shell.setMinimalShellMode(true)
        } else if (store.shell.minimalShellMode && (y <= 10 || dy < -10)) {
          store.shell.setMinimalShellMode(false)
        }

        if (
          !isScrolledDown &&
          event.nativeEvent.contentOffset.y > s.window.height
        ) {
          setIsScrolledDown(true)
        } else if (
          isScrolledDown &&
          event.nativeEvent.contentOffset.y < s.window.height
        ) {
          setIsScrolledDown(false)
        }
      },
      [store, isScrolledDown],
    ),
    isScrolledDown,
    useCallback(() => {
      setIsScrolledDown(false)
      store.shell.setMinimalShellMode(false)
      lastY.current = 1e8 // NOTE we set this very high so that the onScroll logic works right -prf
    }, [store, setIsScrolledDown]),
  ]
}
