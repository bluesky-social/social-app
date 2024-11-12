import React from 'react'
import {Pressable, PressableProps, StyleProp, ViewStyle} from 'react-native'
import Animated, {
  cancelAnimation,
  runOnUI,
  useAnimatedStyle,
  useReducedMotion,
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
  const reducedMotion = useReducedMotion()
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }))

  return (
    <AnimatedPressable
      accessibilityRole="button"
      onPressIn={evt => {
        onPressIn?.(evt)
        runOnUI(() => {
          'worklet'
          cancelAnimation(scale)
          scale.set(withTiming(targetScale, {duration: 100}))
        })()
      }}
      onPressOut={evt => {
        onPressOut?.(evt)
        runOnUI(() => {
          'worklet'
          cancelAnimation(scale)
          scale.set(withTiming(1, {duration: 100}))
        })()
      }}
      style={[!reducedMotion && animatedStyle, style]}
      {...rest}>
      {children}
    </AnimatedPressable>
  )
}
