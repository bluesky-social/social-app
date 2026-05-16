import {
  type KeyboardStickyViewProps,
  useReanimatedKeyboardAnimation,
} from 'react-native-keyboard-controller'
import Animated, {useAnimatedStyle} from 'react-native-reanimated'

// Vendored from https://github.com/kirillzyusko/react-native-keyboard-controller/blob/main/src/components/KeyboardStickyView/index.tsx
// Converted to Reanimated to support `minimumOffset` clamping.
export function KeyboardStickyView({
  children,
  offset: {closed = 0, opened = 0} = {},
  style,
  enabled = true,
  minimumOffset,
  ...props
}: KeyboardStickyViewProps & {
  /**
   * Stop the stickyview going lower than this (i.e. bottom safe area)
   */
  minimumOffset?: number
}) {
  const {height, progress} = useReanimatedKeyboardAnimation()

  const animatedStyle = useAnimatedStyle(() => {
    const offset = closed + (opened - closed) * progress.get()
    let translateY: number

    if (enabled) {
      let h = height.get()
      if (minimumOffset != null) {
        h = Math.min(h, -minimumOffset)
      }
      translateY = h + offset
    } else {
      translateY = closed
    }

    return {
      transform: [{translateY}],
    }
  })

  return (
    <Animated.View style={[animatedStyle, style]} {...props}>
      {children}
    </Animated.View>
  )
}
