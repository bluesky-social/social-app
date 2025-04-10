import React, {useEffect, useState} from 'react'
import {View} from 'react-native'
import {ActivityIndicator} from 'react-native'
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  SharedValue,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedStyle,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {BlurView} from 'expo-blur'
import {useIsFetching} from '@tanstack/react-query'

import {isIOS} from '#/platform/detection'
import {RQKEY_ROOT as STARTERPACK_RQKEY_ROOT} from '#/state/queries/actor-starter-packs'
import {RQKEY_ROOT as FEED_RQKEY_ROOT} from '#/state/queries/post-feed'
import {RQKEY_ROOT as FEEDGEN_RQKEY_ROOT} from '#/state/queries/profile-feedgens'
import {RQKEY_ROOT as LIST_RQKEY_ROOT} from '#/state/queries/profile-lists'
import {usePagerHeaderContext} from '#/view/com/pager/PagerHeaderContext'
import {atoms as a} from '#/alf'

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView)

export function GrowableBanner({
  backButton,
  children,
}: {
  backButton?: React.ReactNode
  children: React.ReactNode
}) {
  const pagerContext = usePagerHeaderContext()

  // plain non-growable mode for Android/Web
  if (!pagerContext || !isIOS) {
    return (
      <View style={[a.w_full, a.h_full]}>
        {children}
        {backButton}
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
  const {top: topInset} = useSafeAreaInsets()
  const isFetching = useIsProfileFetching()
  const animateSpinner = useShouldAnimateSpinner({isFetching, scrollY})

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(scrollY.get(), [-150, 0], [2, 1], {
          extrapolateRight: Extrapolation.CLAMP,
        }),
      },
    ],
  }))

  const animatedBlurViewProps = useAnimatedProps(() => {
    return {
      intensity: interpolate(
        scrollY.get(),
        [-300, -65, -15],
        [50, 40, 0],
        Extrapolation.CLAMP,
      ),
    }
  })

  const animatedSpinnerStyle = useAnimatedStyle(() => {
    const scrollYValue = scrollY.get()
    return {
      display: scrollYValue < 0 ? 'flex' : 'none',
      opacity: interpolate(
        scrollYValue,
        [-60, -15],
        [1, 0],
        Extrapolation.CLAMP,
      ),
      transform: [
        {translateY: interpolate(scrollYValue, [-150, 0], [-75, 0])},
        {rotate: '90deg'},
      ],
    }
  })

  const animatedBackButtonStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(scrollY.get(), [-150, 10], [-150, 10], {
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
      <View
        style={[
          a.absolute,
          a.inset_0,
          {top: topInset - (isIOS ? 15 : 0)},
          a.justify_center,
          a.align_center,
        ]}>
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

function useShouldAnimateSpinner({
  isFetching,
  scrollY,
}: {
  isFetching: boolean
  scrollY: SharedValue<number>
}) {
  const [isOverscrolled, setIsOverscrolled] = useState(false)
  // HACK: it reports a scroll pos of 0 for a tick when fetching finishes
  // so paper over that by keeping it true for a bit -sfn
  const stickyIsOverscrolled = useStickyToggle(isOverscrolled, 10)

  useAnimatedReaction(
    () => scrollY.get() < -5,
    (value, prevValue) => {
      if (value !== prevValue) {
        runOnJS(setIsOverscrolled)(value)
      }
    },
    [scrollY],
  )

  const [isAnimating, setIsAnimating] = useState(isFetching)

  if (isFetching && !isAnimating) {
    setIsAnimating(true)
  }

  if (!isFetching && isAnimating && !stickyIsOverscrolled) {
    setIsAnimating(false)
  }

  return isAnimating
}

// stayed true for at least `delay` ms before returning to false
function useStickyToggle(value: boolean, delay: number) {
  const [prevValue, setPrevValue] = useState(value)
  const [isSticking, setIsSticking] = useState(false)

  useEffect(() => {
    if (isSticking) {
      const timeout = setTimeout(() => setIsSticking(false), delay)
      return () => clearTimeout(timeout)
    }
  }, [isSticking, delay])

  if (value !== prevValue) {
    setIsSticking(prevValue) // Going true -> false should stick.
    setPrevValue(value)
    return prevValue ? true : value
  }

  return isSticking ? true : value
}
