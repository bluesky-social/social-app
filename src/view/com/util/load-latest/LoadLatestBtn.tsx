import {StyleSheet, View} from 'react-native'
import Animated from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {useMediaQuery} from 'react-responsive'

import {HITSLOP_20} from '#/lib/constants'
import {PressableScale} from '#/lib/custom-animations/PressableScale'
import {useMinimalShellFabTransform} from '#/lib/hooks/useMinimalShellTransform'
import {usePalette} from '#/lib/hooks/usePalette'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {clamp} from '#/lib/numbers'
import {useGate} from '#/lib/statsig/statsig'
import {colors} from '#/lib/styles'
import {isWeb} from '#/platform/detection'
import {useSession} from '#/state/session'
import {useLayoutBreakpoints} from '#/alf'

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
  const {centerColumnOffset} = useLayoutBreakpoints()
  const fabMinimalShellTransform = useMinimalShellFabTransform()
  const insets = useSafeAreaInsets()

  // move button inline if it starts overlapping the left nav
  const isTallViewport = useMediaQuery({minHeight: 700})

  const gate = useGate()
  if (gate('remove_show_latest_button')) {
    return null
  }

  // Adjust height of the fab if we have a session only on mobile web. If we don't have a session, we want to adjust
  // it on both tablet and mobile since we are showing the bottom bar (see createNativeStackNavigatorWithAuth)
  const showBottomBar = hasSession ? isMobile : isTabletOrMobile

  const bottomPosition = isTablet
    ? {bottom: 50}
    : {bottom: clamp(insets.bottom, 15, 60) + 15}

  return (
    <Animated.View style={[showBottomBar && fabMinimalShellTransform]}>
      <PressableScale
        style={[
          styles.loadLatest,
          isDesktop &&
            (isTallViewport
              ? styles.loadLatestOutOfLine
              : styles.loadLatestInline),
          isTablet &&
            (centerColumnOffset
              ? styles.loadLatestInlineOffset
              : styles.loadLatestInline),
          pal.borderDark,
          pal.view,
          bottomPosition,
        ]}
        onPress={onPress}
        hitSlop={HITSLOP_20}
        accessibilityLabel={label}
        accessibilityHint=""
        targetScale={0.9}>
        <FontAwesomeIcon icon="angle-up" color={pal.colors.text} size={19} />
        {showIndicator && <View style={[styles.indicator, pal.borderDark]} />}
      </PressableScale>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  loadLatest: {
    zIndex: 20,
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
    // @ts-expect-error web only
    left: 'calc(50vw - 282px)',
  },
  loadLatestInlineOffset: {
    // @ts-expect-error web only
    left: 'calc(50vw - 432px)',
  },
  loadLatestOutOfLine: {
    // @ts-expect-error web only
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
