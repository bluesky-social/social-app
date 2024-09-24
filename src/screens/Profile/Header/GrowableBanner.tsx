import React from 'react'
import {View} from 'react-native'
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated'

import {usePagerHeaderContext} from '#/view/com/pager/PagerHeaderContext'
import {atoms as a} from '#/alf'

export function GrowableBanner({children}: {children: React.ReactNode}) {
  const pagerContext = usePagerHeaderContext()

  if (!pagerContext) {
    return <View style={[a.w_full, a.h_full]}>{children}</View>
  }

  const {scrollY} = pagerContext

  return <GrowableBannerInner scrollY={scrollY}>{children}</GrowableBannerInner>
}

function GrowableBannerInner({
  scrollY,
  children,
}: {
  scrollY: SharedValue<number>
  children: React.ReactNode
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(scrollY.value, [-150, 0], [2, 1], {
          extrapolateRight: Extrapolation.CLAMP,
        }),
      },
    ],
  }))

  return (
    <Animated.View
      style={[
        a.absolute,
        {left: 0, right: 0, bottom: 0},
        {height: 150},
        {transformOrigin: 'bottom'},
        animatedStyle,
      ]}>
      {children}
    </Animated.View>
  )
}
