import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

import {isTouchDevice} from '#/lib/browser'
import {IS_NATIVE} from '#/env'

const DEFAULT_TARGET_SCALE = IS_NATIVE || isTouchDevice ? 0.98 : 1

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export function PressableScale({
  targetScale = DEFAULT_TARGET_SCALE,
  children,
  style,
  onPressIn,
  onPressOut,
  ...rest
}: {
  targetScale?: number
  style?: StyleProp<ViewStyle>
} & Exclude<PressableProps, 'onPressIn' | 'onPressOut' | 'style'>) {
  const reducedMotion = useReducedMotion()

  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.get()}],
  }))

  return (
    <AnimatedPressable
      accessibilityRole="button"
      onPressIn={e => {
        if (onPressIn) {
          onPressIn(e)
        }
        cancelAnimation(scale)
        scale.set(() => withTiming(targetScale, {duration: 100}))
      }}
      onPressOut={e => {
        if (onPressOut) {
          onPressOut(e)
        }
        cancelAnimation(scale)
        scale.set(() => withTiming(1, {duration: 100}))
      }}
      style={[!reducedMotion && animatedStyle, style]}
      {...rest}>
      {children}
    </AnimatedPressable>
  )
}
