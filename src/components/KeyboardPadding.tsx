import React from 'react'
import {useKeyboardHandler} from 'react-native-keyboard-controller'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'

import {isAndroid} from 'platform/detection'

export function KeyboardPadding({androidOnly = true}: {androidOnly?: boolean}) {
  if (!isAndroid && androidOnly) {
    return null
  }
  return <KeyboardPaddingInner />
}

function KeyboardPaddingInner({maxHeight}: {maxHeight?: number}) {
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
