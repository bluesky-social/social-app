import {StyleSheet} from 'react-native'
import Animated from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {useMediaQuery} from 'react-responsive'

import {HITSLOP_20} from '#/lib/constants'
import {PressableScale} from '#/lib/custom-animations/PressableScale'
import {useMinimalShellFabTransform} from '#/lib/hooks/useMinimalShellTransform'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {clamp} from '#/lib/numbers'
import {useGate} from '#/lib/statsig/statsig'
import {useSession} from '#/state/session'
import {atoms as a, useLayoutBreakpoints, useTheme, web} from '#/alf'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {ArrowTop_Stroke2_Corner0_Rounded as ArrowIcon} from '#/components/icons/Arrow'
import {CENTER_COLUMN_OFFSET} from '#/components/Layout'
import {SubtleWebHover} from '#/components/SubtleWebHover'

export function LoadLatestBtn({
  onPress,
  label,
  showIndicator,
}: {
  onPress: () => void
  label: string
  showIndicator: boolean
}) {
  const {hasSession} = useSession()
  const {isDesktop, isTablet, isMobile, isTabletOrMobile} = useWebMediaQueries()
  const {centerColumnOffset} = useLayoutBreakpoints()
  const fabMinimalShellTransform = useMinimalShellFabTransform()
  const insets = useSafeAreaInsets()
  const t = useTheme()
  const {
    state: hovered,
    onIn: onHoverIn,
    onOut: onHoverOut,
  } = useInteractionState()

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
    <Animated.View
      testID="loadLatestBtn"
      style={[
        a.fixed,
        a.z_20,
        {left: 18},
        isDesktop &&
          (isTallViewport
            ? styles.loadLatestOutOfLine
            : styles.loadLatestInline),
        isTablet &&
          (centerColumnOffset
            ? styles.loadLatestInlineOffset
            : styles.loadLatestInline),
        bottomPosition,
        showBottomBar && fabMinimalShellTransform,
      ]}>
      <PressableScale
        style={[
          {
            width: 42,
            height: 42,
          },
          a.rounded_full,
          a.align_center,
          a.justify_center,
          a.border,
          t.atoms.border_contrast_low,
          showIndicator ? {backgroundColor: t.palette.primary_50} : t.atoms.bg,
        ]}
        onPress={onPress}
        hitSlop={HITSLOP_20}
        accessibilityLabel={label}
        accessibilityHint=""
        targetScale={0.9}
        onPointerEnter={onHoverIn}
        onPointerLeave={onHoverOut}>
        <SubtleWebHover hover={hovered} style={[a.rounded_full]} />
        <ArrowIcon
          size="md"
          style={[
            a.z_10,
            showIndicator
              ? {color: t.palette.primary_500}
              : t.atoms.text_contrast_medium,
          ]}
        />
      </PressableScale>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  loadLatestInline: {
    left: web('calc(50vw - 282px)'),
  },
  loadLatestInlineOffset: {
    left: web(`calc(50vw - 282px + ${CENTER_COLUMN_OFFSET}px)`),
  },
  loadLatestOutOfLine: {
    left: web('calc(50vw - 382px)'),
  },
})
