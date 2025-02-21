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
  enabledWeb,
}: {
  direction: 'Backward' | 'Forward'
  style?: StyleProp<ViewStyle>
  children: React.ReactNode
  enabledWeb?: boolean
}) {
  const entering = direction === 'Forward' ? SlideInRight : SlideInLeft
  const webEntering = enabledWeb ? FadeIn.duration(90) : undefined
  const exiting = FadeOut.duration(90) // Totally vibes based
  const webExiting = enabledWeb ? FadeOut.duration(90) : undefined

  return (
    <Animated.View
      entering={isWeb ? webEntering : entering}
      exiting={isWeb ? webExiting : exiting}
      style={style}>
      {children}
    </Animated.View>
  )
}
