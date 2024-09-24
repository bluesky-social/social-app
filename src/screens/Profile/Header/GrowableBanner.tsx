import React from 'react'
import {View} from 'react-native'
import {ActivityIndicator} from 'react-native'
import Animated, {
  Extrapolation,
  FadeIn,
  FadeOut,
  interpolate,
  LayoutAnimationConfig,
  SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
} from 'react-native-reanimated'
import {BlurView} from 'expo-blur'
import {useIsFetching} from '@tanstack/react-query'

import {isIOS} from '#/platform/detection'
import {RQKEY_ROOT as STARTERPACK_RQKEY_ROOT} from '#/state/queries/actor-starter-packs'
import {RQKEY_ROOT as FEED_RQKEY_ROOT} from '#/state/queries/post-feed'
import {RQKEY_ROOT as FEEDGEN_RQKEY_ROOT} from '#/state/queries/profile-feedgens'
import {RQKEY_ROOT as LIST_RQKEY_ROOT} from '#/state/queries/profile-lists'
import {usePagerHeaderContext} from '#/view/com/pager/PagerHeaderContext'
import {atoms as a} from '#/alf'
import {ArrowBottom_Stroke2_Corner0_Rounded as ArrowDownIcon} from '#/components/icons/Arrow'

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
  const isFetching = useIsProfileFetching()

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

  const animatedSpinnerStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        scrollY.value,
        [-60, -15],
        [1, 0],
        Extrapolation.CLAMP,
      ),
      transform: [
        {translateY: interpolate(scrollY.value, [-150, 0], [-75, 0])},
      ],
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
      <View style={[a.absolute, a.inset_0, a.justify_center, a.align_center]}>
        <Animated.View style={[animatedSpinnerStyle]}>
          <LayoutAnimationConfig skipEntering skipExiting>
            {isFetching ? (
              <Animated.View key={1} exiting={FadeOut.delay(500).duration(50)}>
                <ActivityIndicator size="small" color="white" />
              </Animated.View>
            ) : (
              <Animated.View key={2} entering={FadeIn.delay(500).duration(50)}>
                <ArrowDownIcon fill="white" size="lg" />
              </Animated.View>
            )}
          </LayoutAnimationConfig>
        </Animated.View>
      </View>
    </>
  )
}

function useIsProfileFetching() {
  // are any of the profile-related queries fetching?
  return [
    useIsFetching({queryKey: [FEED_RQKEY_ROOT]}),
    useIsFetching({queryKey: [FEEDGEN_RQKEY_ROOT]}),
    useIsFetching({queryKey: [LIST_RQKEY_ROOT]}),
    useIsFetching({queryKey: [STARTERPACK_RQKEY_ROOT]}),
  ].some(isFetching => isFetching)
}
