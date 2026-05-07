import {forwardRef, useCallback, useEffect, useState} from 'react'
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
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import Svg, {
  ClipPath,
  Defs,
  G,
  Path,
  Rect,
  type SvgProps,
} from 'react-native-svg'
import {Image} from 'expo-image'
import * as SplashScreen from 'expo-splash-screen'

import {Logotype} from '#/view/icons/Logotype'
// @ts-ignore
import splashImagePointer from '../assets/splash/splash.png'
// @ts-ignore
import darkSplashImagePointer from '../assets/splash/splash-dark.png'
const splashImageUri = RNImage.resolveAssetSource(splashImagePointer).uri
const darkSplashImageUri = RNImage.resolveAssetSource(
  darkSplashImagePointer,
).uri

export const Logo = forwardRef(function LogoImpl(props: SvgProps, ref) {
  const width = 1000
  const height = width * (243 / 285)
  return (
    <Svg
      fill="none"
      // @ts-ignore it's fiiiiine
      ref={ref}
      viewBox="0 0 285 243"
      style={[{width, height}, props.style]}>
      <G clipPath="url(#clip0_splash)">
        <Path
          fill={props.fill || '#fff'}
          d="M148.846 144.562C148.846 159.75 161.158 172.062 176.346 172.062H207.012V185.865H176.346C161.158 185.865 148.846 198.177 148.846 213.365V243.045H136.029V213.365C136.029 198.177 123.717 185.865 108.529 185.865H77.8633V172.062H108.529C123.717 172.062 136.029 159.75 136.029 144.562V113.896H148.846V144.562Z"
        />
        <Path
          fill={props.fill || '#fff'}
          d="M170.946 31.8766C160.207 42.616 160.207 60.0281 170.946 70.7675L192.631 92.4516L182.871 102.212L161.186 80.5275C150.447 69.7881 133.035 69.7881 122.296 80.5275L101.309 101.514L92.2456 92.4509L113.232 71.4642C123.972 60.7248 123.972 43.3128 113.232 32.5733L91.5488 10.8899L101.309 1.12988L122.993 22.814C133.732 33.5533 151.144 33.5534 161.884 22.814L183.568 1.12988L192.631 10.1925L170.946 31.8766Z"
        />
        <Path
          fill={props.fill || '#fff'}
          d="M79.0525 75.3259C75.1216 89.9962 83.8276 105.076 98.498 109.006L128.119 116.943L124.547 130.275L94.9267 122.338C80.2564 118.407 65.1772 127.113 61.2463 141.784L53.5643 170.453L41.1837 167.136L48.8654 138.467C52.7963 123.797 44.0902 108.718 29.4199 104.787L-0.201172 96.8497L3.37124 83.5173L32.9923 91.4542C47.6626 95.3851 62.7419 86.679 66.6728 72.0088L74.6098 42.3877L86.9895 45.7048L79.0525 75.3259Z"
        />
        <Path
          fill={props.fill || '#fff'}
          d="M218.413 71.4229C222.344 86.093 237.423 94.7992 252.094 90.8683L281.715 82.9313L285.287 96.2628L255.666 104.2C240.995 108.131 232.29 123.21 236.22 137.88L243.902 166.55L231.522 169.867L223.841 141.198C219.91 126.528 204.831 117.822 190.16 121.753L160.539 129.69L156.967 116.357L186.588 108.42C201.258 104.49 209.964 89.4103 206.033 74.74L198.096 45.1189L210.476 41.8018L218.413 71.4229Z"
        />
      </G>
      <Defs>
        <ClipPath id="clip0_splash">
          <Rect width="285" height="243" fill="white" />
        </ClipPath>
      </Defs>
    </Svg>
  )
})

type Props = {
  isReady: boolean
}

export function Splash(props: React.PropsWithChildren<Props>) {
  'use no memo'
  const insets = useSafeAreaInsets()
  const intro = useSharedValue(0)
  const outroLogo = useSharedValue(0)
  const outroApp = useSharedValue(0)
  const outroAppOpacity = useSharedValue(0)
  const [isAnimationComplete, setIsAnimationComplete] = useState(false)
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const [isLayoutReady, setIsLayoutReady] = useState(false)
  const [reduceMotion, setReduceMotion] = useState<boolean | undefined>(false)
  const isReady =
    props.isReady &&
    isImageLoaded &&
    isLayoutReady &&
    reduceMotion !== undefined

  const colorScheme = useColorScheme()
  const isDarkMode = colorScheme === 'dark'

  const logoAnimation = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: interpolate(intro.get(), [0, 1], [0.8, 1], 'clamp'),
        },
        {
          scale: interpolate(
            outroLogo.get(),
            [0, 0.08, 1],
            [1, 0.8, 500],
            'clamp',
          ),
        },
      ],
      opacity: interpolate(intro.get(), [0, 1], [0, 1], 'clamp'),
    }
  })
  const bottomLogoAnimation = useAnimatedStyle(() => {
    return {
      opacity: interpolate(intro.get(), [0, 1], [0, 1], 'clamp'),
    }
  })
  const reducedLogoAnimation = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: interpolate(intro.get(), [0, 1], [0.8, 1], 'clamp'),
        },
      ],
      opacity: interpolate(intro.get(), [0, 1], [0, 1], 'clamp'),
    }
  })

  const logoWrapperAnimation = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        outroAppOpacity.get(),
        [0, 0.1, 0.2, 1],
        [1, 1, 0, 0],
        'clamp',
      ),
    }
  })

  const appAnimation = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: interpolate(outroApp.get(), [0, 1], [1.1, 1], 'clamp'),
        },
      ],
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
          intro.set(() =>
            withTiming(
              1,
              {duration: 400, easing: Easing.out(Easing.cubic)},
              () => {
                'worklet'
                // set these values to check animation at specific point
                outroLogo.set(() =>
                  withTiming(
                    1,
                    {duration: 1200, easing: Easing.in(Easing.cubic)},
                    () => {
                      runOnJS(onFinish)()
                    },
                  ),
                )
                outroApp.set(() =>
                  withTiming(1, {
                    duration: 1200,
                    easing: Easing.inOut(Easing.cubic),
                  }),
                )
                outroAppOpacity.set(() =>
                  withTiming(1, {
                    duration: 1200,
                    easing: Easing.in(Easing.cubic),
                  }),
                )
              },
            ),
          )
        })
        .catch(() => {})
    }
  }, [onFinish, intro, outroLogo, outroApp, outroAppOpacity, isReady])

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion)
  }, [])

  const logoAnimations =
    reduceMotion === true ? reducedLogoAnimation : logoAnimation

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

          <Animated.View
            style={[
              bottomLogoAnimation,
              {
                position: 'absolute',
                bottom: insets.bottom + 40,
                left: 0,
                right: 0,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0,
              },
            ]}>
            <Logotype fill={isDarkMode ? '#fff' : '#000'} width={90} />
          </Animated.View>
        </View>
      )}

      {isReady && (
        <>
          <Animated.View style={[{flex: 1}, appAnimation]}>
            {props.children}
          </Animated.View>

          {!isAnimationComplete && (
            <Animated.View
              style={[
                StyleSheet.absoluteFillObject,
                logoWrapperAnimation,
                {
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  transform: [{translateY: -(insets.top / 2)}, {scale: 0.1}], // scale from 1000px to 100px
                },
              ]}>
              <Animated.View style={[logoAnimations]}>
                <Logo fill={isDarkMode ? '#fff' : '#000'} />
              </Animated.View>
            </Animated.View>
          )}
        </>
      )}
    </View>
  )
}
