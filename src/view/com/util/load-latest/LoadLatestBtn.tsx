import React from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import Animated from 'react-native-reanimated'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {useMediaQuery} from 'react-responsive'

import {HITSLOP_20} from '#/lib/constants'
import {useMinimalShellFabTransform} from '#/lib/hooks/useMinimalShellTransform'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {colors} from '#/lib/styles'
import {isNativeTablet} from '#/platform/detection'
import {useSession} from '#/state/session'
import {useTheme} from '#/alf'

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
  const t = useTheme()
  const {hasSession} = useSession()
  const {isDesktop, isTablet, isMobile, isTabletOrMobile} = useWebMediaQueries()
  const fabMinimalShellTransform = useMinimalShellFabTransform()

  // move button inline if it starts overlapping the left nav
  const isTallViewport = useMediaQuery({minHeight: 700})

  // Adjust height of the fab if we have a session only on mobile web. If we don't have a session, we want to adjust
  // it on both tablet and mobile since we are showing the bottom bar (see createNativeStackNavigatorWithAuth)
  const showBottomBar = hasSession ? isMobile : isTabletOrMobile

  return (
    <AnimatedTouchableOpacity
      style={[
        styles.loadLatest,
        isDesktop &&
          (isTallViewport
            ? styles.loadLatestOutOfLine
            : styles.loadLatestInline),
        isTablet && !isNativeTablet && styles.loadLatestInline,
        t.atoms.border_contrast_high,
        t.atoms.bg,
        showBottomBar && fabMinimalShellTransform,
      ]}
      onPress={onPress}
      hitSlop={HITSLOP_20}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="">
      <FontAwesomeIcon icon="angle-up" color={t.atoms.text.color} size={19} />
      {showIndicator && (
        <View style={[styles.indicator, t.atoms.border_contrast_high]} />
      )}
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
  // @ts-ignore web only
  loadLatestInline: isWeb
    ? {
        left: 'calc(50vw - 282px)',
      }
    : {},
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
