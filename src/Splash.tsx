import React, {useCallback, useEffect} from 'react'
import {View, Image, StyleSheet} from 'react-native'
import * as SplashScreen from 'expo-splash-screen'
// @ts-ignore
import splashImagePointer from '../assets/icon-android-foreground.png'
import LinearGradient from 'react-native-linear-gradient'
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import MaskedView from '@react-native-masked-view/masked-view'

const splashImageUri = Image.resolveAssetSource(splashImagePointer).uri

type Props = {
  isReady: boolean
}

SplashScreen.preventAutoHideAsync().catch(() => {})

export function Splash(props: React.PropsWithChildren<Props>) {
  const progress = useSharedValue(0)
  const [isAnimationComplete, setIsAnimationComplete] = React.useState(false)

  const onFinish = useCallback(() => {
    SplashScreen.hideAsync().catch(() => {})
    setIsAnimationComplete(true)
  }, [])

  const onLoadEnd = React.useCallback(() => {
    SplashScreen.hideAsync().catch(() => {})
  }, [])

  useEffect(() => {
    if (props.isReady) {
      progress.value = withTiming(1, {duration: 1000}, () => {
        runOnJS(onFinish)()
      })
    }
  }, [onFinish, progress, props.isReady])

  const imageScale = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: interpolate(
            progress.value,
            [0, 0.2, 1],
            [1, 0.8, 100],
            'clamp',
          ),
        },
      ],
    }
  })

  const appScale = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: interpolate(progress.value, [0, 1], [1.1, 1]),
        },
      ],
    }
  })

  const opacityScale = useAnimatedStyle(() => {
    return {
      opacity: interpolate(progress.value, [0, 0.15, 0.3], [0, 0, 1], 'clamp'),
    }
  })

  return (
    <View style={{flex: 1}}>
      {isAnimationComplete ? null : (
        <LinearGradient
          colors={['#0A7AFF', '#59B9FF']}
          style={[StyleSheet.absoluteFillObject]}
        />
      )}
      <MaskedView
        style={{flex: 1}}
        maskElement={
          <View
            style={{
              // Transparent background because mask is based off alpha channel.
              backgroundColor: 'transparent',
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Animated.Image
              onLoadEnd={onLoadEnd}
              style={[
                {
                  resizeMode: 'contain',
                  width: '50%',
                  height: '50%',
                  position: 'absolute',
                  top: '25%',
                  left: '25%',
                },
                imageScale,
              ]}
              source={{uri: splashImageUri}}
            />
          </View>
        }>
        <Animated.View style={[{flex: 1}, opacityScale, appScale]}>
          {props.children}
        </Animated.View>
      </MaskedView>
    </View>
  )
}

import Svg, {SvgProps, Path} from 'react-native-svg'
const Logo = (props: SvgProps) => (
  <Svg width={'100%'} height={'100%'} fill="none" {...props}>
    <Path
      fill="#fff"
      d="M180 141.964c-16.301-31.702-60.692-90.782-101.965-119.92C38.497-5.868 23.414-1.032 13.526 3.436 2.081 8.608 0 26.178 0 36.516c0 10.338 5.667 84.756 9.364 97.178 12.215 41.044 55.696 54.913 95.74 50.462 2.047-.304 4.123-.584 6.225-.844-2.062.33-4.139.612-6.225.844-58.684 8.691-110.8 30.077-42.446 106.174 75.19 77.85 103.047-16.693 117.342-64.628 14.295 47.935 30.76 139.069 115.995 64.628 64.005-64.628 17.585-97.48-41.099-106.172a131.118 131.118 0 0 1-6.225-.843c2.102.259 4.178.54 6.225.843 40.044 4.452 83.525-9.418 95.74-50.461 3.697-12.422 9.364-86.84 9.364-97.178 0-10.338-2.081-27.909-13.526-33.08-9.888-4.468-24.971-9.305-64.509 18.608C240.692 51.184 196.301 110.262 180 141.964Z"
    />
  </Svg>
)
