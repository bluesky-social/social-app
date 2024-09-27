import React from 'react'
import {Pressable, PressableProps, StyleProp, ViewStyle} from 'react-native'
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

import {isTouchDevice} from '#/lib/browser'
import {isNative} from '#/platform/detection'

const DEFAULT_TARGET_SCALE = isNative || isTouchDevice ? 0.98 : 1

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
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }))

  return (
    <AnimatedPressable
      accessibilityRole="button"
      onPressIn={e => {
        'worklet'
        if (onPressIn) {
          runOnJS(onPressIn)(e)
        }
        cancelAnimation(scale)
        scale.value = withTiming(targetScale, {duration: 100})
      }}
      onPressOut={e => {
        'worklet'
        if (onPressOut) {
          runOnJS(onPressOut)(e)
        }
        cancelAnimation(scale)
        scale.value = withTiming(1, {duration: 100})
      }}
      style={[animatedStyle, style]}
      {...rest}>
      {children}
    </AnimatedPressable>
  )
}
