import React, {useCallback, useImperativeHandle} from 'react'
import {Pressable} from 'react-native'
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export interface GrowWrapperRef {
  reset: () => void
}

export const GrowWrapper = React.forwardRef(function GrowWrapper(
  {
    onOpenMenu,
    children,
  }: {
    onOpenMenu: () => unknown
    children: React.ReactNode
  },
  ref,
) {
  const scale = useSharedValue(1)
  const animationDidComplete = useSharedValue(false)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }))

  const reset = useCallback(() => {
    cancelAnimation(scale)
    animationDidComplete.value = false
    scale.value = withTiming(1, {duration: 200})
  }, [animationDidComplete, scale])

  const onTouchStart = React.useCallback(() => {
    scale.value = withTiming(1.05, {duration: 750}, finished => {
      if (!finished) return

      animationDidComplete.value = true
      runOnJS(onOpenMenu)()
    })
  }, [scale, animationDidComplete, onOpenMenu])

  const onTouchEnd = React.useCallback(() => {
    if (!animationDidComplete.value) {
      reset()
    }
  }, [animationDidComplete, reset])

  useImperativeHandle(ref, () => ({
    reset,
  }))

  return (
    <AnimatedPressable
      style={animatedStyle}
      unstable_pressDelay={300}
      onPressIn={onTouchStart}
      onTouchEnd={onTouchEnd}>
      {children}
    </AnimatedPressable>
  )
})
