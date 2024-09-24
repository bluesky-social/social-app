import React from 'react'
import {View} from 'react-native'
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
} from 'react-native-reanimated'
import {BlurView} from 'expo-blur'

import {isIOS} from '#/platform/detection'
import {usePagerHeaderContext} from '#/view/com/pager/PagerHeaderContext'
import {atoms as a} from '#/alf'

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView)

export function GrowableBanner({children}: {children: React.ReactNode}) {
  const pagerContext = usePagerHeaderContext()

  // pagerContext should only be present on iOS, but better safe than sorry
  if (!pagerContext || !isIOS) {
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

  const animatedBlurViewProps = useAnimatedProps(() => {
    return {
      intensity: interpolate(
        scrollY.value,
        [-200, -15],
        [80, 0],
        Extrapolation.CLAMP,
      ),
    }
  })
  return (
    <>
      <Animated.View
        style={[
          a.absolute,
          {left: 0, right: 0, bottom: 0},
          {height: 150},
          {transformOrigin: 'bottom'},
          animatedStyle,
        ]}>
        {children}
        <AnimatedBlurView
          style={[a.absolute, a.inset_0]}
          tint="dark"
          animatedProps={animatedBlurViewProps}
        />
      </Animated.View>
    </>
  )
}
