import {
  type AnimatedRef,
  type MeasuredDimensions,
} from 'react-native-reanimated'

/**
 * Measures a lightbox thumbnail from the JS thread. Fabric reads the layout
 * from the shadow tree synchronously, just like Reanimated's `measure` does on
 * the UI thread, so there's no need to hop threads for it.
 */
export function measureThumb(
  thumbRef: AnimatedRef | null | undefined,
): MeasuredDimensions | null {
  let rect: MeasuredDimensions | null = null
  thumbRef?.current?.measure((x, y, width, height, pageX, pageY) => {
    // Views that aren't mounted measure as all zeros rather than failing.
    if (width > 0 && height > 0) {
      rect = {x, y, width, height, pageX, pageY}
    }
  })
  return rect
}
