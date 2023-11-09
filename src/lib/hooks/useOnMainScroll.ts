import {useState, useCallback} from 'react'
import {NativeSyntheticEvent, NativeScrollEvent} from 'react-native'
import {useSetMinimalShellMode, useMinimalShellMode} from '#/state/shell'
import {useShellLayout} from '#/state/shell/shell-layout'
import {isWeb} from 'platform/detection'
import {
  useAnimatedScrollHandler,
  useSharedValue,
  interpolate,
} from 'react-native-reanimated'

function clamp(num: number, min: number, max: number) {
  'worklet'
  return Math.min(Math.max(num, min), max)
}

export type OnScrollCb = (
  event: NativeSyntheticEvent<NativeScrollEvent>,
) => void
export type ResetCb = () => void

export function useOnMainScroll(): [OnScrollCb, boolean, ResetCb] {
  const {headerHeight} = useShellLayout()

  let [isScrolledDown, setIsScrolledDown] = useState(false)
  const mode = useMinimalShellMode()
  const setMode = useSetMinimalShellMode()

  const startDragOffset = useSharedValue<number | null>(null)
  const startMode = useSharedValue<number | null>(null)

  const scrollHandler = useAnimatedScrollHandler({
    onBeginDrag(e) {
      startDragOffset.value = e.contentOffset.y
      startMode.value = mode.value
    },
    onEndDrag(e) {
      startDragOffset.value = null
      startMode.value = null
      if (e.contentOffset.y > headerHeight.value / 2) {
        setMode(Math.round(mode.value))
      } else {
        setMode(0)
      }
    },
    onScroll(e) {
      if (startDragOffset.value === null || startMode.value === null) {
        if (mode.value !== 0 && e.contentOffset.y < headerHeight.value) {
          setMode(0)
          return
        }
        if (isWeb) {
          startDragOffset.value = e.contentOffset.y
          startMode.value = mode.value
        }
        return
      }
      const dy = e.contentOffset.y - startDragOffset.value
      const dProgress = interpolate(
        dy,
        [-headerHeight.value, headerHeight.value],
        [-1, 1],
      )
      const newValue = clamp(startMode.value + dProgress, 0, 1)
      if (newValue !== mode.value) {
        mode.value = newValue
      }
      if (isWeb) {
        startDragOffset.value = e.contentOffset.y
        startMode.value = mode.value
      }
    },
  })

  return [
    scrollHandler,
    isScrolledDown,
    useCallback(() => {
      setIsScrolledDown(false)
      setMode(0)
    }, [setMode]),
  ]
}
