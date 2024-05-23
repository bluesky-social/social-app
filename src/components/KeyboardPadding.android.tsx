import React from 'react'
import {useKeyboardHandler} from 'react-native-keyboard-controller'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'

export function KeyboardPadding() {
  const keyboardHeight = useSharedValue(0)

  useKeyboardHandler({
    onMove: e => {
      'worklet'
      keyboardHeight.value = e.height
    },
  })

  const animatedStyle = useAnimatedStyle(() => ({
    height: keyboardHeight.value,
  }))

  return <Animated.View style={animatedStyle} />
}
