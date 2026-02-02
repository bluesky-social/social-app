import {type StyleProp, type ViewStyle} from 'react-native'
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  SlideInLeft,
  SlideInRight,
} from 'react-native-reanimated'
import type React from 'react'

import {IS_WEB} from '#/env'

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
  const entering =
    direction === 'Forward'
      ? SlideInRight.easing(Easing.out(Easing.exp))
      : SlideInLeft.easing(Easing.out(Easing.exp))
  const webEntering = enabledWeb ? FadeIn.duration(90) : undefined
  const exiting = FadeOut.duration(90) // Totally vibes based
  const webExiting = enabledWeb ? FadeOut.duration(90) : undefined

  return (
    <Animated.View
      entering={IS_WEB ? webEntering : entering}
      exiting={IS_WEB ? webExiting : exiting}
      style={style}>
      {children}
    </Animated.View>
  )
}
