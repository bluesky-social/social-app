import React from 'react'
import {useKeyboardHandler} from 'react-native-keyboard-controller'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'

export function KeyboardControllerPadding({maxHeight}: {maxHeight?: number}) {
  const keyboardHeight = useSharedValue(0)

  useKeyboardHandler(
    {
      onMove: e => {
        'worklet'

        if (maxHeight && e.height > maxHeight) {
          keyboardHeight.value = maxHeight
        } else {
          keyboardHeight.value = e.height
        }
      },
    },
    [maxHeight],
  )

  const animatedStyle = useAnimatedStyle(() => ({
    height: keyboardHeight.value,
  }))

  return <Animated.View style={animatedStyle} />
}
