import React from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {useMediaQuery} from 'react-responsive'

import {HITSLOP_20} from '#/lib/constants'
import {useBottomBarOffset} from '#/lib/hooks/useBottomBarOffset'
import {useMinimalShellFabTransform} from '#/lib/hooks/useMinimalShellTransform'
import {usePalette} from '#/lib/hooks/usePalette'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {clamp} from '#/lib/numbers'
import {colors} from '#/lib/styles'
import {isWeb} from '#/platform/detection'
import {useSession} from '#/state/session'

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity)

export function LoadLatestBtn({
  onPress,
  label,
  showIndicator,
}: {
  onPress: () => void
  label: string
  showIndicator: boolean
}) {
  const pal = usePalette('default')
  const {hasSession} = useSession()
  const {isDesktop, isTablet, isMobile, isTabletOrMobile} = useWebMediaQueries()
  const fabMinimalShellTransform = useMinimalShellFabTransform()
  const insets = useSafeAreaInsets()
  const translateY = useSharedValue(100)
  const opacity = useSharedValue(0)

  // move button inline if it starts overlapping the left nav
  const isTallViewport = useMediaQuery({minHeight: 700})

  const showBottomBar = hasSession ? isMobile : isTabletOrMobile
  const bottomBarHeight = useBottomBarOffset()

  // Get the actual bottom value for animation
  const bottomValue = isTablet
    ? 50
    : clamp(insets.bottom, 15, 60 + bottomBarHeight) + 15 + 38

  React.useEffect(() => {
    // Animate in from below the button's resting position
    translateY.value = withSpring(0, {
      damping: 15,
      stiffness: 100,
    })
    opacity.value = withTiming(1, {duration: 100})

    return () => {
      // Animate out to below the button's resting position
      translateY.value = withSpring(bottomValue, {duration: 100})
      opacity.value = withTiming(0, {duration: 100})
    }
  }, [translateY, opacity, bottomValue])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{translateY: translateY.value}],
      opacity: opacity.value,
      bottom: bottomValue,
    }
  })

  return (
    <AnimatedTouchableOpacity
      style={[
        styles.loadLatest,
        isDesktop &&
          (isTallViewport
            ? styles.loadLatestOutOfLine
            : styles.loadLatestInline),
        isTablet && styles.loadLatestInline,
        pal.borderDark,
        pal.view,
        showBottomBar && fabMinimalShellTransform,
        animatedStyle,
      ]}
      onPress={onPress}
      hitSlop={HITSLOP_20}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="">
      <FontAwesomeIcon icon="angle-up" color={pal.colors.text} size={19} />
      {showIndicator && <View style={[styles.indicator, pal.borderDark]} />}
    </AnimatedTouchableOpacity>
  )
}

const styles = StyleSheet.create({
  loadLatest: {
    // @ts-ignore 'fixed' is web only -prf
    position: isWeb ? 'fixed' : 'absolute',
    left: 18,
    borderWidth: StyleSheet.hairlineWidth,
    width: 52,
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadLatestInline: {
    // @ts-ignore web only
    left: 'calc(50vw - 282px)',
  },
  loadLatestOutOfLine: {
    // @ts-ignore web only
    left: 'calc(50vw - 382px)',
  },
  indicator: {
    position: 'absolute',
    top: 3,
    right: 3,
    backgroundColor: colors.blue3,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
})
