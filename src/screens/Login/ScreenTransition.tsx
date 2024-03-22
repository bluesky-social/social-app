import React from 'react'
import Animated, {FadeInRight, FadeOutLeft} from 'react-native-reanimated'

export function ScreenTransition({children}: {children: React.ReactNode}) {
  return (
    <Animated.View entering={FadeInRight} exiting={FadeOutLeft}>
      {children}
    </Animated.View>
  )
}
