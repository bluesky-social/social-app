import React from 'react'
import {Keyboard} from 'react-native'
import {Gesture, GestureDetector} from 'react-native-gesture-handler'
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import {ChatBskyConvoDefs} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {HITSLOP_10} from '#/lib/constants'
import {useHaptics} from '#/lib/haptics'
import {atoms as a} from '#/alf'
import {MessageMenu} from '#/components/dms/MessageMenu'
import {useMenuControl} from '#/components/Menu'

export function ActionsWrapper({
  message,
  isFromSelf,
  children,
}: {
  message: ChatBskyConvoDefs.MessageView
  isFromSelf: boolean
  children: React.ReactNode
}) {
  const {_} = useLingui()
  const playHaptic = useHaptics()
  const menuControl = useMenuControl()

  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.get()}],
  }))

  const open = React.useCallback(() => {
    playHaptic()
    Keyboard.dismiss()
    menuControl.open()
  }, [menuControl, playHaptic])

  const shrink = React.useCallback(() => {
    'worklet'
    cancelAnimation(scale)
    scale.set(() => withTiming(1, {duration: 200}))
  }, [scale])

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .hitSlop(HITSLOP_10)
    .onEnd(open)
    .runOnJS(true)

  const pressAndHoldGesture = Gesture.LongPress()
    .onStart(() => {
      'worklet'
      scale.set(() =>
        withTiming(1.05, {duration: 200}, finished => {
          if (!finished) return
          runOnJS(open)()
          shrink()
        }),
      )
    })
    .onTouchesUp(shrink)
    .onTouchesMove(shrink)
    .cancelsTouchesInView(false)

  const composedGestures = Gesture.Exclusive(
    doubleTapGesture,
    pressAndHoldGesture,
  )

  return (
    <GestureDetector gesture={composedGestures}>
      <Animated.View
        style={[
          {
            maxWidth: '80%',
          },
          isFromSelf ? a.self_end : a.self_start,
          animatedStyle,
        ]}
        accessible={true}
        accessibilityActions={[
          {name: 'activate', label: _(msg`Open message options`)},
        ]}
        onAccessibilityAction={open}>
        {children}
        <MessageMenu message={message} control={menuControl} />
      </Animated.View>
    </GestureDetector>
  )
}
