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
  const intro = useSharedValue(0)
  const outroLogo = useSharedValue(0)
  const outroApp = useSharedValue(0)
  const [isAnimationComplete, setIsAnimationComplete] = React.useState(false)

  const logoAnimations = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: interpolate(intro.value, [0, 1], [0.8, 1], 'clamp'),
        },
        {
          scale: interpolate(
            outroLogo.value,
            [0, 0.08, 0.1, 1],
            [1, 0.8, 0.8, 800],
            'clamp',
          ),
        },
      ],
      opacity: interpolate(intro.value, [0, 1], [0, 1], 'clamp'),
    }
  })

  const appAnimation = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: interpolate(
            outroApp.value,
            [0, 0.7, 1],
            [1.1, 1.1, 1],
            'clamp',
          ),
        },
      ],
      opacity: interpolate(outroApp.value, [0, 0.7, 1], [0, 0, 1], 'clamp'),
    }
  })

  const onFinish = useCallback(() => setIsAnimationComplete(true), [])

  useEffect(() => {
    // hide on mount
    SplashScreen.hideAsync().catch(() => {})

    if (props.isReady) {
      intro.value = withTiming(
        1,
        {duration: 200, easing: Easing.out(Easing.cubic)},
        async () => {
          outroLogo.value = withTiming(
            1,
            {duration: 1000, easing: Easing.in(Easing.cubic)},
            () => {
              runOnJS(onFinish)()
            },
          )
          outroApp.value = withTiming(
            1,
            {duration: 1000, easing: Easing.inOut(Easing.cubic)},
            () => {
              runOnJS(onFinish)()
            },
          )
        },
      )
    }
  }, [onFinish, intro, outroLogo, outroApp, props.isReady])

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
                transform: [{scale: 0.1}], // scale from 1000px to 100px
              },
            ]}>
            <AnimatedLogo width={1000} style={[logoAnimations]} />
          </Animated.View>
        }>
        {!isAnimationComplete && (
          <View
            style={[StyleSheet.absoluteFillObject, {backgroundColor: 'white'}]}
          />
        )}

        <Animated.View style={[{flex: 1}, appAnimation]}>
          {props.children}
        </Animated.View>
      </MaskedView>
    </View>
  )
}
