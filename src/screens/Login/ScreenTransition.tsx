import {type StyleProp, type ViewStyle} from 'react-native'
import Animated, {FadeInRight, FadeOutLeft} from 'react-native-reanimated'
import type React from 'react'

export function ScreenTransition({
  style,
  children,
}: {
  style?: StyleProp<ViewStyle>
  children: React.ReactNode
}) {
  return (
    <Animated.View style={style} entering={FadeInRight} exiting={FadeOutLeft}>
      {children}
    </Animated.View>
  )
}
