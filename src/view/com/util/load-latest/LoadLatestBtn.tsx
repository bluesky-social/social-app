import React from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {colors} from 'lib/styles'
import {HITSLOP_20} from 'lib/constants'
import {useMinimalShellMode} from 'lib/hooks/useMinimalShellMode'
import Animated from 'react-native-reanimated'
const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity)
import {isWeb} from 'platform/detection'

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
  const {isDesktop, isTablet, isMobile} = useWebMediaQueries()
  const {fabMinimalShellTransform} = useMinimalShellMode()

  return (
    <AnimatedTouchableOpacity
      style={[
        styles.loadLatest,
        isDesktop && styles.loadLatestDesktop,
        isTablet && styles.loadLatestTablet,
        pal.borderDark,
        pal.view,
        isMobile && fabMinimalShellTransform,
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
  loadLatestTablet: {
    // @ts-ignore web only
    left: 'calc(50vw - 282px)',
  },
  loadLatestDesktop: {
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
