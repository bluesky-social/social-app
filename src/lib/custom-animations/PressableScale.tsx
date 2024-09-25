import React from 'react'
import {Pressable, PressableProps} from 'react-native'
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

export function PressableScale({
  targetScale = DEFAULT_TARGET_SCALE,
  children,
  ...rest
}: {targetScale?: number} & Exclude<
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
      onPressIn={e => {
        'worklet'
        if (rest.onPressIn) {
          runOnJS(rest.onPressIn)(e)
        }
        cancelAnimation(scale)
        scale.value = withTiming(targetScale, {duration: 100})
      }}
      onPressOut={e => {
        'worklet'
        if (rest.onPressOut) {
          runOnJS(rest.onPressOut)(e)
        }
        cancelAnimation(scale)
        scale.value = withTiming(1, {duration: 100})
      }}
      {...rest}>
      <Animated.View style={style}>{children as React.ReactNode}</Animated.View>
    </Pressable>
  )
}
