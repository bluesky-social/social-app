import React from 'react'
import {StyleProp, ViewStyle} from 'react-native'
import Animated, {
  FadeOut,
  SlideInLeft,
  SlideInRight,
} from 'react-native-reanimated'

export function ScreenTransition({
  direction,
  style,
  children,
}: {
  direction: 'Backward' | 'Forward'
  style?: StyleProp<ViewStyle>
  children: React.ReactNode
}) {
  const entering = direction === 'Forward' ? SlideInRight : SlideInLeft

  return (
    <Animated.View
      entering={entering}
      exiting={FadeOut.duration(90)} // Totally vibes based
      style={style}>
      {children}
    </Animated.View>
  )
}
