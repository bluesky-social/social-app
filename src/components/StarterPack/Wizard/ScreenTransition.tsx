import React from 'react'
import {StyleProp, ViewStyle} from 'react-native'
import Animated, {
  FadeIn,
  FadeOut,
  SlideInLeft,
  SlideInRight,
} from 'react-native-reanimated'

import {isWeb} from '#/platform/detection'

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
      entering={isWeb ? FadeIn.duration(90) : entering}
      exiting={FadeOut.duration(90)} // Totally vibes based
      style={style}>
      {children}
    </Animated.View>
  )
}
