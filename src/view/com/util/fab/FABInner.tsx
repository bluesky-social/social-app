import React, {ComponentProps} from 'react'
import {StyleSheet, TouchableWithoutFeedback} from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {LinearGradient} from 'expo-linear-gradient'

import {useMinimalShellFabTransform} from '#/lib/hooks/useMinimalShellTransform'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {clamp} from '#/lib/numbers'
import {gradients} from '#/lib/styles'
import {isWeb} from '#/platform/detection'
import {useHaptics} from 'lib/haptics'
import {useHapticsDisabled} from 'state/preferences'
import {useInteractionState} from '#/components/hooks/useInteractionState'

export interface FABProps
  extends ComponentProps<typeof TouchableWithoutFeedback> {
  testID?: string
  icon: JSX.Element
}

export function FABInner({testID, icon, onPress, ...props}: FABProps) {
  const insets = useSafeAreaInsets()
  const {isMobile, isTablet} = useWebMediaQueries()
  const fabMinimalShellTransform = useMinimalShellFabTransform()
  const {
    state: isPressed,
    onIn: onPressIn,
    onOut: onPressOut,
  } = useInteractionState()
  const playHaptic = useHaptics()
  const isHapticsDisabled = useHapticsDisabled()

  const size = isTablet ? styles.sizeLarge : styles.sizeRegular

  const tabletSpacing = isTablet
    ? {right: 50, bottom: 50}
    : {right: 24, bottom: clamp(insets.bottom, 15, 60) + 15}

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: withTiming(isPressed ? 1.1 : 1, {
          duration: 250,
          easing: Easing.out(Easing.quad),
        }),
      },
    ],
  }))

  return (
    <TouchableWithoutFeedback
      testID={testID}
      onPress={e => {
        playHaptic()
        setTimeout(
          () => {
            onPress?.(e)
          },
          isHapticsDisabled ? 0 : 75,
        )
      }}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      {...props}>
      <Animated.View
        style={[
          styles.outer,
          size,
          tabletSpacing,
          isMobile && fabMinimalShellTransform,
        ]}>
        <Animated.View style={animatedStyle}>
          <LinearGradient
            colors={[gradients.blueLight.start, gradients.blueLight.end]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={[styles.inner, size]}>
            {icon}
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </TouchableWithoutFeedback>
  )
}

const styles = StyleSheet.create({
  sizeRegular: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  sizeLarge: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  outer: {
    // @ts-ignore web-only
    position: isWeb ? 'fixed' : 'absolute',
    zIndex: 1,
    cursor: 'pointer',
  },
  inner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
})
