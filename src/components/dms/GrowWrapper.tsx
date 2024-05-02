import React, {useCallback} from 'react'
import {Pressable} from 'react-native'
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

import {useHaptics} from 'lib/haptics'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export const GrowWrapper = function GrowWrapper({
  onOpenMenu,
  children,
}: {
  onOpenMenu: () => unknown
  children: React.ReactNode
}) {
  const playHaptic = useHaptics()

  const scale = useSharedValue(1)
  const animationDidComplete = useSharedValue(false)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }))

  const shrink = useCallback(() => {
    'worklet'
    cancelAnimation(scale)
    scale.value = withTiming(1, {duration: 200}, () => {
      animationDidComplete.value = false
    })
  }, [animationDidComplete, scale])

  const grow = React.useCallback(() => {
    'worklet'
    scale.value = withTiming(1.05, {duration: 750}, finished => {
      if (!finished) return
      animationDidComplete.value = true
      runOnJS(playHaptic)()
      runOnJS(onOpenMenu)()

      shrink()
    })
  }, [scale, animationDidComplete, playHaptic, onOpenMenu, shrink])

  return (
    <AnimatedPressable
      style={animatedStyle}
      unstable_pressDelay={200}
      onPressIn={grow}
      onTouchEnd={shrink}>
      {children}
    </AnimatedPressable>
  )
}
