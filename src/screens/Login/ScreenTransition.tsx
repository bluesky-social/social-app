import {ReactNode} from 'react'
import Animated, {FadeInRight, FadeOutLeft} from 'react-native-reanimated'

export function ScreenTransition({children}: {children: ReactNode}) {
  return (
    <Animated.View entering={FadeInRight} exiting={FadeOutLeft}>
      {children}
    </Animated.View>
  )
}
