import {useState, useCallback, useRef} from 'react'
import {NativeSyntheticEvent, NativeScrollEvent} from 'react-native'
import {s} from 'lib/styles'
import {useWebMediaQueries} from './useWebMediaQueries'
import {useSetMinimalShellMode, useMinimalShellMode} from '#/state/shell'
import {
  useAnimatedScrollHandler,
  useSharedValue,
  interpolate,
  Easing,
  withTiming,
} from 'react-native-reanimated'
import {arDZ} from 'date-fns/esm/locale'

const Y_LIMIT = 10

const useDeviceLimits = () => {
  const {isDesktop} = useWebMediaQueries()
  return {
    dyLimitUp: isDesktop ? 30 : 10,
    dyLimitDown: isDesktop ? 150 : 10,
  }
}

function clamp(num: number, min: number, max: number) {
  'worklet'
  return Math.min(Math.max(num, min), max)
}

export type OnScrollCb = (
  event: NativeSyntheticEvent<NativeScrollEvent>,
) => void
export type ResetCb = () => void

export function useOnMainScroll(): [OnScrollCb, boolean, ResetCb] {
  let [isScrolledDown, setIsScrolledDown] = useState(false)
  const mode = useMinimalShellMode()
  const setMode = useSetMinimalShellMode()

  const startDragOffset = useSharedValue<number | null>(null)
  const startMode = useSharedValue<number | null>(null)

  const headerHeight = 80 // TODO

  const scrollHandler = useAnimatedScrollHandler({
    onBeginDrag(e) {
      startDragOffset.value = e.contentOffset.y
      startMode.value = mode.value
    },
    onEndDrag(e) {
      startDragOffset.value = null
      startMode.value = null
      if (e.contentOffset.y > headerHeight / 2) {
        setMode(Math.round(mode.value))
      } else {
        setMode(0)
      }
    },
    onScroll(e) {
      if (startDragOffset.value === null || startMode.value === null) {
        // TODO: web
        if (mode.value !== 0 && e.contentOffset.y < headerHeight) {
          setMode(0)
        }
        return
      }
      const dy = e.contentOffset.y - startDragOffset.value
      const dProgress = interpolate(dy, [-headerHeight, headerHeight], [-1, 1])
      const newValue = clamp(startMode.value + dProgress, 0, 1)
      if (newValue !== mode.value) {
        mode.value = newValue
      }
    },
  })

  return [
    scrollHandler,
    isScrolledDown,
    useCallback(() => {
      console.log('reset?')
      setIsScrolledDown(false)
      setMode(0)
    }, [setMode]),
  ]
}
