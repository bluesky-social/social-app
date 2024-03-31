import React from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import Animated from 'react-native-reanimated'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {useMediaQuery} from 'react-responsive'

import {HITSLOP_20} from 'lib/constants'
import {useMinimalShellMode} from 'lib/hooks/useMinimalShellMode'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {colors} from 'lib/styles'
const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity)
import {isWeb} from 'platform/detection'
import {useSession} from 'state/session'

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
  const {fabMinimalShellTransform} = useMinimalShellMode()

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
        isTablet && styles.loadLatestInline,
        pal.borderDark,
        pal.view,
        showBottomBar && fabMinimalShellTransform,
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
    bottom: 44,
    borderWidth: 1,
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
