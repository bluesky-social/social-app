import React, {useState} from 'react'
import {View} from 'react-native'
import {ActivityIndicator} from 'react-native'
import Animated, {
  Extrapolation,
  interpolate,
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
import {useOverscrolled} from '#/components/hooks/useOverscrolled'

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView)

export function GrowableBanner({
  backButton,
  children,
}: {
  backButton?: React.ReactNode
  children: React.ReactNode
}) {
  const pagerContext = usePagerHeaderContext()

  // pagerContext should only be present on iOS, but better safe than sorry
  if (!pagerContext || !isIOS) {
    return (
      <View style={[a.w_full, a.h_full]}>
        {backButton}
        {children}
      </View>
    )
  }

  const {scrollY} = pagerContext

  return (
    <GrowableBannerInner scrollY={scrollY} backButton={backButton}>
      {children}
    </GrowableBannerInner>
  )
}

function GrowableBannerInner({
  scrollY,
  backButton,
  children,
}: {
  scrollY: SharedValue<number>
  backButton?: React.ReactNode
  children: React.ReactNode
}) {
  const isFetching = useIsProfileFetching()
  const animateSpinner = useFetchingWhenOverscrolled({isFetching, scrollY})

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
        [-300, -65, -15],
        [50, 40, 0],
        Extrapolation.CLAMP,
      ),
    }
  })

  const animatedSpinnerStyle = useAnimatedStyle(() => {
    return {
      display: scrollY.value < 0 ? 'flex' : 'none',
      opacity: interpolate(
        scrollY.value,
        [-60, -15],
        [1, 0],
        Extrapolation.CLAMP,
      ),
      transform: [
        {translateY: interpolate(scrollY.value, [-150, 0], [-75, 0])},
        {rotate: '90deg'},
      ],
    }
  })

  const animatedBackButtonStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(scrollY.value, [-150, 60], [-150, 60], {
          extrapolateRight: Extrapolation.CLAMP,
        }),
      },
    ],
  }))

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
          <ActivityIndicator
            key={animateSpinner ? 'spin' : 'stop'}
            size="large"
            color="white"
            animating={animateSpinner}
            hidesWhenStopped={false}
          />
        </Animated.View>
      </View>
      <Animated.View style={[animatedBackButtonStyle]}>
        {backButton}
      </Animated.View>
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

export function useFetchingWhenOverscrolled({
  isFetching,
  scrollY,
}: {
  isFetching: boolean
  scrollY?: SharedValue<number>
}) {
  const isOverscrolled = useOverscrolled({scrollY})
  const [isAnimating, setIsAnimating] = useState(isFetching)

  if (isFetching && !isAnimating) {
    setIsAnimating(true)
  }

  if (!isFetching && isAnimating && !isOverscrolled) {
    setIsAnimating(false)
  }

  return isAnimating
}
