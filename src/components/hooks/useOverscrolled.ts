import {useState} from 'react'
import {
  runOnJS,
  SharedValue,
  useAnimatedReaction,
} from 'react-native-reanimated'

import {useStickyToggle} from './useStickyToggle'

export function useOverscrolled({
  scrollY,
  threshold = -5,
}: {
  scrollY?: SharedValue<number>
  threshold?: number
}) {
  const [isOverscrolled, setIsOverscrolled] = useState(false)
  // HACK: it reports a scroll pos of 0 for a tick when fetching finishes
  // so paper over that by keeping it true for a bit -sfn
  const stickyIsOverscrolled = useStickyToggle(isOverscrolled, 10)

  useAnimatedReaction(
    () => (scrollY ? scrollY.value < threshold : false),
    (value, prevValue) => {
      if (value !== prevValue) {
        runOnJS(setIsOverscrolled)(value)
      }
    },
  )

  return stickyIsOverscrolled
}
