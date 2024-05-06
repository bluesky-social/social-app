import React, {useCallback} from 'react'
import {Keyboard, Pressable, View} from 'react-native'
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import {ChatBskyConvoDefs} from '@atproto-labs/api'

import {useHaptics} from 'lib/haptics'
import {atoms as a} from '#/alf'
import {MessageMenu} from '#/components/dms/MessageMenu'
import {useMenuControl} from '#/components/Menu'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export function ActionsWrapper({
  message,
  isFromSelf,
  children,
}: {
  message: ChatBskyConvoDefs.MessageView
  isFromSelf: boolean
  children: React.ReactNode
}) {
  const playHaptic = useHaptics()
  const menuControl = useMenuControl()

  const scale = useSharedValue(1)
  const animationDidComplete = useSharedValue(false)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }))

  // Reanimated's `runOnJS` doesn't like refs, so we can't use `runOnJS(menuControl.open)()`. Instead, we'll use this
  // function
  const open = useCallback(() => {
    Keyboard.dismiss()
    menuControl.open()
  }, [menuControl])

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
      runOnJS(open)()

      shrink()
    })
  }, [scale, animationDidComplete, playHaptic, shrink, open])

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
      <MessageMenu message={message} control={menuControl} hideTrigger={true} />
    </View>
  )
}
