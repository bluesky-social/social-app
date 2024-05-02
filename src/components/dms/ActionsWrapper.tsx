import React, {useCallback} from 'react'
import {Pressable, View} from 'react-native'
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

import {useHaptics} from 'lib/haptics'
import {atoms as a} from '#/alf'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export const ActionsWrapper = function GrowWrapper({
  isFromSelf,
  onOpenMenu,
  children,
}: {
  isFromSelf: boolean
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
    <View
      style={[
        {
          maxWidth: '65%',
        },
        isFromSelf ? a.self_end : a.self_start,
      ]}>
      <AnimatedPressable
        style={animatedStyle}
        unstable_pressDelay={200}
        onPressIn={grow}
        onTouchEnd={shrink}>
        {children}
      </AnimatedPressable>
    </View>
  )
}
