import React, {useCallback, useEffect} from 'react'
import {View, StyleSheet} from 'react-native'
import * as SplashScreen from 'expo-splash-screen'
import LinearGradient from 'react-native-linear-gradient'
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import MaskedView from '@react-native-masked-view/masked-view'
import {Logo} from '#/view/icons/Logo'

type Props = {
  isReady: boolean
}

SplashScreen.preventAutoHideAsync().catch(() => {})

const AnimatedLogo = Animated.createAnimatedComponent(Logo)

export function Splash(props: React.PropsWithChildren<Props>) {
  const fadeAnimationProgress = useSharedValue(0)
  const scaleAnimationProgress = useSharedValue(0)
  const [isAnimationComplete, setIsAnimationComplete] = React.useState(false)

  const logoScaleAnimation = useAnimatedStyle(() => {
    return {
      width: interpolate(
        scaleAnimationProgress.value,
        [0, 0.2, 0.22, 1],
        [100, 100, 1000, 1000],
        'clamp',
      ),
      height: interpolate(
        scaleAnimationProgress.value,
        [0, 0.2, 0.22, 1],
        [100, 100, 1000, 1000],
        'clamp',
      ),
      transform: [
        {
          scale: interpolate(
            scaleAnimationProgress.value,
            [0, 0.2, 0.22, 1],
            [1, 0.8, 0.8, 200],
            'clamp',
          ),
        },
      ],
    }
  })

  const logoFadeInAnimation = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        fadeAnimationProgress.value,
        [0, 0.5, 1],
        [0, 1, 1],
        'clamp',
      ),
    }
  })

  const appScaleAnimation = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: interpolate(
            scaleAnimationProgress.value,
            [0, 0.22, 0.5, 1],
            [1.1, 1.09, 1.08, 1],
            'clamp',
          ),
        },
      ],
    }
  })

  // const opacityScale = { opacity: 1 }
  const appFadeInAnimation = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        scaleAnimationProgress.value,
        [0, 0.22, 1],
        [0, 0, 1],
        'clamp',
      ),
    }
  })

  const onFinish = useCallback(() => setIsAnimationComplete(true), [])

  useEffect(() => {
    // hide on mount
    SplashScreen.hideAsync().catch(() => {})

    if (props.isReady) {
      fadeAnimationProgress.value = withTiming(
        1,
        {duration: 800, easing: Easing.inOut(Easing.cubic)},
        () => {
          scaleAnimationProgress.value = withTiming(
            1,
            {duration: 1200, easing: Easing.inOut(Easing.cubic)},
            () => {
              runOnJS(onFinish)()
            },
          )
        },
      )
    }
  }, [onFinish, fadeAnimationProgress, scaleAnimationProgress, props.isReady])

  return (
    <View style={{flex: 1}}>
      {!isAnimationComplete && (
        <LinearGradient
          colors={['#0A7AFF', '#59B9FF']}
          style={[StyleSheet.absoluteFillObject]}
        />
      )}

      <MaskedView
        style={{flex: 1}}
        maskElement={
          <Animated.View
            style={[
              {
                // Transparent background because mask is based off alpha channel.
                backgroundColor: 'transparent',
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
              },
              logoFadeInAnimation,
            ]}>
            <AnimatedLogo width={100} style={[logoScaleAnimation]} />
          </Animated.View>
        }>
        {!isAnimationComplete && (
          <View
            style={[StyleSheet.absoluteFillObject, {backgroundColor: 'white'}]}
          />
        )}

        <Animated.View
          style={[{flex: 1}, appFadeInAnimation, appScaleAnimation]}>
          {props.children}
        </Animated.View>
      </MaskedView>
    </View>
  )
}
