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

  const onTouchStart = React.useCallback(() => {
    scale.value = withTiming(1.05, {duration: 750}, finished => {
      if (!finished) return
      animationDidComplete.value = true
      runOnJS(playHaptic)()
      runOnJS(onOpenMenu)()
    })
  }, [scale, animationDidComplete, playHaptic, onOpenMenu])

  const onTouchEnd = useCallback(() => {
    cancelAnimation(scale)
    animationDidComplete.value = false
    scale.value = withTiming(1, {duration: 200})
  }, [animationDidComplete, scale])

  return (
    <AnimatedPressable
      style={animatedStyle}
      unstable_pressDelay={300}
      onPressIn={onTouchStart}
      onTouchEnd={onTouchEnd}>
      {children}
    </AnimatedPressable>
  )
}
