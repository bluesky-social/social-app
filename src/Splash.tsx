import React, {useCallback, useEffect} from 'react'
import {
  AccessibilityInfo,
  Image as RNImage,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native'
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import {Image} from 'expo-image'
import * as SplashScreen from 'expo-splash-screen'

// @ts-ignore
import splashImagePointer from '../assets/splash/splash-mobile.png'
// @ts-ignore
import darkSplashImagePointer from '../assets/splash/splash-mobile-dark.png'
const splashImageUri = RNImage.resolveAssetSource(splashImagePointer).uri
const darkSplashImageUri = RNImage.resolveAssetSource(
  darkSplashImagePointer,
).uri

type Props = {
  isReady: boolean
}

export function Splash(props: React.PropsWithChildren<Props>) {
  'use no memo'
  const outroAppOpacity = useSharedValue(0)
  const colorScheme = useColorScheme()
  const [isAnimationComplete, setIsAnimationComplete] = React.useState(false)
  const [isImageLoaded, setIsImageLoaded] = React.useState(false)
  const [isLayoutReady, setIsLayoutReady] = React.useState(false)
  const [reduceMotion, setReduceMotion] = React.useState<boolean | undefined>(
    false,
  )
  const isReady =
    props.isReady &&
    isImageLoaded &&
    isLayoutReady &&
    reduceMotion !== undefined
  const isDarkMode = colorScheme === 'dark'

  const appAnimation = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        outroAppOpacity.get(),
        [0, 0.1, 0.2, 1],
        [0, 0, 1, 1],
        'clamp',
      ),
    }
  })

  const onFinish = useCallback(() => setIsAnimationComplete(true), [])
  const onLayout = useCallback(() => setIsLayoutReady(true), [])
  const onLoadEnd = useCallback(() => setIsImageLoaded(true), [])

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync()
        .then(() => {
          outroAppOpacity.set(() =>
            withTiming(1, {
              duration: 1200,
              easing: Easing.in(Easing.cubic),
            }),
          )
        })
        .catch(() => {})
    }
  }, [onFinish, outroAppOpacity, isReady])

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion)
  }, [])

  return (
    <View style={{flex: 1}} onLayout={onLayout}>
      {!isAnimationComplete && (
        <View style={StyleSheet.absoluteFillObject}>
          <Image
            accessibilityIgnoresInvertColors
            onLoadEnd={onLoadEnd}
            source={{uri: isDarkMode ? darkSplashImageUri : splashImageUri}}
            style={StyleSheet.absoluteFillObject}
          />
        </View>
      )}

      {isReady && (
        <>
          <Animated.View style={[{flex: 1}, appAnimation]}>
            {props.children}
          </Animated.View>
        </>
      )}
    </View>
  )
}
