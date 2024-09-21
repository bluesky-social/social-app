import React from 'react'
import {Pressable, PressableProps} from 'react-native'
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

export function ScaleOnPressIn({
  targetScale,
  children,
  ...rest
}: {targetScale: number} & Exclude<
  PressableProps,
  'onPressIn' | 'onPressOut'
>) {
  const scale = useSharedValue(1)

  const style = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }))

  return (
    <Pressable
      accessibilityRole="button"
      onPressIn={() => {
        'worklet'
        cancelAnimation(scale)
        scale.value = withTiming(targetScale, {duration: 100})
      }}
      onPressOut={() => {
        'worklet'
        cancelAnimation(scale)
        scale.value = withTiming(1, {duration: 100})
      }}
      {...rest}>
      <Animated.View style={style}>{children as React.ReactNode}</Animated.View>
    </Pressable>
  )
}
