import {type StyleProp, type ViewStyle} from 'react-native'
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  SlideInLeft,
  SlideInRight,
} from 'react-native-reanimated'
import type React from 'react'

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
  const entering =
    direction === 'Forward'
      ? SlideInRight.easing(Easing.out(Easing.exp))
      : SlideInLeft.easing(Easing.out(Easing.exp))
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
