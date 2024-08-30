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
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Image} from 'expo-image'
import * as SplashScreen from 'expo-splash-screen'
import MaskedView from '@react-native-masked-view/masked-view'

// import {SvgProps} from 'react-native-svg'
import {isAndroid} from '#/platform/detection'
import {Logotype} from '#/view/icons/Logotype'
// @ts-ignore
import splashImagePointer from '../assets/splash.png'
// @ts-ignore
import darkSplashImagePointer from '../assets/splash-dark.png'
const splashImageUri = RNImage.resolveAssetSource(splashImagePointer).uri
const darkSplashImageUri = RNImage.resolveAssetSource(
  darkSplashImagePointer,
).uri

export const Logo = React.forwardRef(function LogoImpl() {
  return (
    <svg
      viewBox="0 0 7305 2084"
      xmlns="http://www.w3.org/2000/svg"
      fillRule="evenodd"
      clipRule="evenodd"
      strokeLinejoin="round"
      strokeMiterlimit="2">
      <path fill="none" d="M0 0h7304.17v2083.33H0z" />
      <clipPath id="a">
        <path d="M0 0h7304.17v2083.33H0z" />
      </clipPath>
      <g clipPath="url(#a)">
        <g fill="#3165d4" fillRule="nonzero">
          <path d="M3211.03 1606.38l434.349-1129.43h-182.427l-345.307 936.126-347.48-936.126h-184.598l436.521 1129.43h188.942zM3695.7 1045.8c0 330.969 225.447 560.579 552.243 560.579 244.063 0 384.709-132.387 444.691-233.747l-107.553-78.605c-51.708 72.399-153.056 167.553-335.069 167.553-223.38 0-384.709-144.799-386.778-384.752h862.493c2.069-20.685 2.069-43.44 2.069-49.645 0-322.695-194.423-550.237-510.878-550.237-285.429 0-521.218 225.473-521.218 568.854zm175.808-91.017c12.41-202.719 169.603-337.175 345.41-337.175 177.877 0 333.001 113.771 343.343 337.175h-688.753zM5382.8 446.201c-171.94 0-298.175 104.481-337.351 217.67V474.498h-169.764v1131.88h171.94v-541.999c0-241.614 76.177-446.224 335.175-446.224V446.196zM5939.77 1636.06c154.735 0 283.317-89.364 335.622-191.805v163.47h172.169V474.335h-174.349v688.756c0 187.446-119.865 316.042-294.214 316.042-152.555 0-268.061-108.98-268.061-289.887V474.335h-172.17v708.372c0 257.193 137.3 453.358 401.003 453.358zM6563.7 1376.3c47.572 101.359 148.92 229.61 374.368 229.61 208.901 0 366.094-128.251 366.094-318.558 0-374.409-541.902-283.393-541.902-525.414 0-93.085 78.596-148.936 177.876-148.936 138.578 0 194.423 80.673 223.379 138.593l119.963-68.262c-28.956-80.674-132.373-206.856-333-206.856-194.423 0-345.411 109.633-345.411 291.666 0 364.067 539.833 279.256 539.833 527.483 0 109.634-91.006 171.69-198.559 171.69-146.851 0-223.38-80.673-268.883-165.484L6563.7 1376.3z" />
        </g>
        <ellipse
          cx="1059.31"
          cy="1041.67"
          rx="892.64"
          ry="875.973"
          fill="#fff"
        />
        <path
          d="M1041.55 0C1616.398 0 2083.1 466.755 2083.1 1041.67c0 574.911-466.703 1041.67-1041.55 1041.67S0 1616.585 0 1041.67C0 466.758 466.703 0 1041.55 0zM530.909 376.797c39.334-33.684 94.522-61.353 142.5-41.869 86.273 35.035 318.066 502.401 318.066 502.401s324.223-460.675 440.674-502.684c39.727-14.331 94.19 10.876 135.728 41.934 145.789 109.007 160.852 261.087 148.25 303.277-15.844 53.042-821.199 1075.01-821.199 1075.01-24.085-9.824-501.267-895.591-527.126-1047.15-24.712-144.838 59.367-243.249 163.107-330.919z"
          fill="#3165d4"
        />
      </g>
    </svg>
  )
})

type Props = {
  isReady: boolean
}

const AnimatedLogo = Animated.createAnimatedComponent(Logo)

export function Splash(props: React.PropsWithChildren<Props>) {
  const insets = useSafeAreaInsets()
  const intro = useSharedValue(0)
  const outroLogo = useSharedValue(0)
  const outroApp = useSharedValue(0)
  const outroAppOpacity = useSharedValue(0)
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

  const colorScheme = useColorScheme()
  const isDarkMode = colorScheme === 'dark'

  const logoAnimation = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: interpolate(intro.value, [0, 1], [0.8, 1], 'clamp'),
        },
        {
          scale: interpolate(
            outroLogo.value,
            [0, 0.08, 1],
            [1, 0.8, 500],
            'clamp',
          ),
        },
      ],
      opacity: interpolate(intro.value, [0, 1], [0, 1], 'clamp'),
    }
  })
  const bottomLogoAnimation = useAnimatedStyle(() => {
    return {
      opacity: interpolate(intro.value, [0, 1], [0, 1], 'clamp'),
    }
  })
  const reducedLogoAnimation = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: interpolate(intro.value, [0, 1], [0.8, 1], 'clamp'),
        },
      ],
      opacity: interpolate(intro.value, [0, 1], [0, 1], 'clamp'),
    }
  })

  const logoWrapperAnimation = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        outroAppOpacity.value,
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
          scale: interpolate(outroApp.value, [0, 1], [1.1, 1], 'clamp'),
        },
      ],
      opacity: interpolate(
        outroAppOpacity.value,
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
          intro.value = withTiming(
            1,
            {duration: 400, easing: Easing.out(Easing.cubic)},
            async () => {
              // set these values to check animation at specific point
              // outroLogo.value = 0.1
              // outroApp.value = 0.1
              outroLogo.value = withTiming(
                1,
                {duration: 1200, easing: Easing.in(Easing.cubic)},
                () => {
                  runOnJS(onFinish)()
                },
              )
              outroApp.value = withTiming(1, {
                duration: 1200,
                easing: Easing.inOut(Easing.cubic),
              })
              outroAppOpacity.value = withTiming(1, {
                duration: 1200,
                easing: Easing.in(Easing.cubic),
              })
            },
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
  // special off-spec color for dark mode
  const logoBg = isDarkMode ? '#0F1824' : '#fff'

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
            <Logotype fill="#fff" width={90} />
          </Animated.View>
        </View>
      )}

      {isReady &&
        (isAndroid || reduceMotion === true ? (
          // Use a simple fade on older versions of android (work around a bug)
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
                <AnimatedLogo
                  fill={logoBg}
                  style={[{opacity: 0}, logoAnimations]}
                />
              </Animated.View>
            )}
          </>
        ) : (
          <MaskedView
            style={[StyleSheet.absoluteFillObject]}
            maskElement={
              <Animated.View
                style={[
                  {
                    // Transparent background because mask is based off alpha channel.
                    backgroundColor: 'transparent',
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    transform: [{translateY: -(insets.top / 2)}, {scale: 0.1}], // scale from 1000px to 100px
                  },
                ]}>
                <AnimatedLogo fill={logoBg} style={[logoAnimations]} />
              </Animated.View>
            }>
            {!isAnimationComplete && (
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  {
                    backgroundColor: logoBg,
                  },
                ]}
              />
            )}
            <Animated.View style={[{flex: 1}, appAnimation]}>
              {props.children}
            </Animated.View>
          </MaskedView>
        ))}
    </View>
  )
}
