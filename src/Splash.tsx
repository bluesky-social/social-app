import React from 'react'
import {View, Image, StyleSheet, Animated, Easing} from 'react-native'
import Constants from 'expo-constants'
import * as SplashScreen from 'expo-splash-screen'
// @ts-ignore
import splashImagePointer from '../assets/splash.png'

const splashImageUri = Image.resolveAssetSource(splashImagePointer).uri

type Props = {
  isReady: boolean
}

SplashScreen.preventAutoHideAsync().catch(() => {})

export function Splash(props: React.PropsWithChildren<Props>) {
  const animation = React.useMemo(() => new Animated.Value(1), [])
  const [isAnimationComplete, setIsAnimationComplete] = React.useState(false)

  React.useEffect(() => {
    if (props.isReady) {
      Animated.timing(animation, {
        toValue: 1.5,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.cubic,
      }).start(() => setIsAnimationComplete(true))
    }
  }, [animation, props.isReady, setIsAnimationComplete])

  const onLoadEnd = React.useCallback(() => {
    SplashScreen.hideAsync().catch(() => {})
  }, [])

  return (
    <View>
      {props.children}

      {!isAnimationComplete && (
        <View style={[StyleSheet.absoluteFillObject]}>
          <Animated.Image
            onLoadEnd={onLoadEnd}
            style={[
              {
                width: '100%',
                height: '100%',
                resizeMode: Constants.expoConfig?.splash?.resizeMode || 'cover',
                transform: [
                  {
                    scale: animation,
                  },
                ],
              },
            ]}
            source={{uri: splashImageUri}}
          />
        </View>
      )}
    </View>
  )
}
