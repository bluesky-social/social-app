import React from 'react'
import {StyleProp, View, ViewStyle} from 'react-native'
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated'

import {isIOS} from '#/platform/detection'
import {usePagerHeaderContext} from '#/view/com/pager/PagerHeaderContext'

export function GrowableAvatar({
  children,
  style,
}: {
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
}) {
  const pagerContext = usePagerHeaderContext()

  // pagerContext should only be present on iOS, but better safe than sorry
  if (!pagerContext || !isIOS) {
    return <View style={style}>{children}</View>
  }

  const {scrollY} = pagerContext

  return (
    <GrowableAvatarInner scrollY={scrollY} style={style}>
      {children}
    </GrowableAvatarInner>
  )
}

function GrowableAvatarInner({
  scrollY,
  children,
  style,
}: {
  scrollY: SharedValue<number>
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(scrollY.get(), [-150, 0], [1.2, 1], {
          extrapolateRight: Extrapolation.CLAMP,
        }),
      },
    ],
  }))

  return (
    <Animated.View
      style={[style, {transformOrigin: 'bottom left'}, animatedStyle]}>
      {children}
    </Animated.View>
  )
}
