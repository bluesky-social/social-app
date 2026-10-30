import {
  type KeyboardStickyViewProps,
  useReanimatedKeyboardAnimation,
} from 'react-native-keyboard-controller'
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
} from 'react-native-reanimated'

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

  // Derived so frames where the clamped offset stays the same are skipped
  const translateY = useDerivedValue(() => {
    const offset = closed + (opened - closed) * progress.get()
    if (!enabled) {
      return closed
    }
    let h = height.get()
    if (minimumOffset != null) {
      h = Math.min(h, -minimumOffset)
    }
    return h + offset
  })

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{translateY: translateY.get()}],
  }))

  return (
    <Animated.View style={[animatedStyle, style]} {...props}>
      {children}
    </Animated.View>
  )
}
