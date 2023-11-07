import {useState, useCallback, useRef} from 'react'
import {NativeSyntheticEvent, NativeScrollEvent} from 'react-native'
import {s} from 'lib/styles'
import {useWebMediaQueries} from './useWebMediaQueries'
import {useSetMinimalShellMode, useMinimalShellMode} from '#/state/shell'

const Y_LIMIT = 10

const useDeviceLimits = () => {
  const {isDesktop} = useWebMediaQueries()
  return {
    dyLimitUp: isDesktop ? 30 : 10,
    dyLimitDown: isDesktop ? 150 : 10,
  }
}

export type OnScrollCb = (
  event: NativeSyntheticEvent<NativeScrollEvent>,
) => void
export type ResetCb = () => void

export function useOnMainScroll(): [OnScrollCb, boolean, ResetCb] {
  let lastY = useRef(0)
  let [isScrolledDown, setIsScrolledDown] = useState(false)
  const {dyLimitUp, dyLimitDown} = useDeviceLimits()
  const minimalShellMode = useMinimalShellMode()
  const setMinimalShellMode = useSetMinimalShellMode()

  return [
    useCallback(
      (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const y = event.nativeEvent.contentOffset.y
        const dy = y - (lastY.current || 0)
        lastY.current = y

        if (!minimalShellMode && dy > dyLimitDown && y > Y_LIMIT) {
          setMinimalShellMode(true)
        } else if (minimalShellMode && (dy < dyLimitUp * -1 || y <= Y_LIMIT)) {
          setMinimalShellMode(false)
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
      [
        dyLimitDown,
        dyLimitUp,
        isScrolledDown,
        minimalShellMode,
        setMinimalShellMode,
      ],
    ),
    isScrolledDown,
    useCallback(() => {
      setIsScrolledDown(false)
      setMinimalShellMode(false)
      lastY.current = 1e8 // NOTE we set this very high so that the onScroll logic works right -prf
    }, [setIsScrolledDown, setMinimalShellMode]),
  ]
}
