import {useState} from 'react'
import {type LayoutChangeEvent} from 'react-native'
import {
  interpolate,
  type SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated'

import {useBreakpoints} from '#/alf'

/**
 * How far, in points, a page moves from rest before it has fully faded out.
 */
const PAGE_FADE_DISTANCE = 100

/**
 * Fades a native pager's pages out as they move away from rest, and back in
 * as the next one settles, on tablets only. Spread the returned `style` and
 * `onLayout` onto the pager view.
 *
 * @param dragProgress The pager's position, in pages (e.g. 1.5 is halfway
 * between the second and third pages).
 */
export function usePagerFade(dragProgress: SharedValue<number>) {
  const {gtMobile} = useBreakpoints()
  const [pageWidth, setPageWidth] = useState(0)

  const style = useAnimatedStyle(() => {
    if (!gtMobile || pageWidth === 0) {
      return {opacity: 1}
    }
    const progress = dragProgress.get()
    const distance = Math.abs(progress - Math.round(progress)) * pageWidth
    return {
      opacity: interpolate(distance, [0, PAGE_FADE_DISTANCE], [1, 0], 'clamp'),
    }
  })

  const onLayout = gtMobile
    ? (event: LayoutChangeEvent) => {
        setPageWidth(event.nativeEvent.layout.width)
      }
    : undefined

  return {style, onLayout}
}
