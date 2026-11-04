import {View} from 'react-native'
import Animated from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {LinearGradient} from 'expo-linear-gradient'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {HITSLOP_10} from '#/lib/constants'
import {PressableScale} from '#/lib/custom-animations/PressableScale'
import {useHaptics} from '#/lib/haptics'
import {type NavigationProp} from '#/lib/routes/types'
import {emitSoftReset} from '#/state/events'
import {useSession} from '#/state/session'
import {useShellHeaderLayout} from '#/state/shell/shell-layout'
import {useHomeHeaderTransform} from '#/view/com/util/MainScrollProvider'
import {Logo} from '#/view/icons/Logo'
import {
  atoms as a,
  useBreakpoints,
  useTheme,
  utils,
  type ViewStyleProp,
} from '#/alf'
import {ButtonIcon} from '#/components/Button'
import {Hashtag_Stroke2_Corner0_Rounded as FeedsIcon} from '#/components/icons/Hashtag'
import * as Layout from '#/components/Layout'
import {Link} from '#/components/Link'
import {useAnalytics} from '#/analytics'
import {IS_DEV, IS_LIQUID_GLASS, IS_NATIVE} from '#/env'

export function HomeHeaderLayoutMobile({
  children,
}: {
  children: React.ReactNode
  tabBarAnchor: React.ReactElement | null | undefined
}) {
  const t = useTheme()
  const {_} = useLingui()
  const ax = useAnalytics()
  const {onLayout} = useShellHeaderLayout()
  const insets = useSafeAreaInsets()
  const headerMinimalShellTransform = useHomeHeaderTransform()
  const {hasSession} = useSession()
  const haptics = useHaptics()
  const {navigate} = useNavigation<NavigationProp>()
  const {gtMobile} = useBreakpoints()

  /*
   * On tablets, stay inside the center column like `NativeCenterBorders`, so
   * the header doesn't cover the column's borders or swallow touches on either
   * side of it
   */
  const widthStyle = gtMobile
    ? [a.w_full, a.self_center, {maxWidth: Layout.CENTER_COLUMN_WIDTH}]
    : {left: 0, right: 0}

  return (
    <>
      {/*
       * The feed scrolls under the status bar, where liquid glass blurs it with
       * a scroll edge effect (see `HomeTabNavigator`). Elsewhere, fade it out
       * so the status bar stays legible once the header hides. The header
       * covers it while shown
       */}
      {IS_NATIVE && !IS_LIQUID_GLASS && <StatusBarFade style={widthStyle} />}
      <Animated.View
        style={[
          a.fixed,
          a.z_10,
          t.atoms.bg,
          {top: 0},
          widthStyle,
          IS_NATIVE && {paddingTop: insets.top},
          headerMinimalShellTransform,
        ]}
        onLayout={onLayout}>
        <Layout.Header.Outer noBottomBorder>
          <Layout.Header.Slot>
            <Layout.Header.MenuButton />
          </Layout.Header.Slot>

          <View style={[a.flex_1, a.align_center]}>
            <PressableScale
              targetScale={0.9}
              onPress={() => {
                if (IS_DEV) {
                  navigate('Debug')
                } else {
                  haptics.tap()
                  emitSoftReset()
                }
              }}>
              <Logo width={30} />
            </PressableScale>
          </View>

          <Layout.Header.Slot>
            {hasSession && (
              <Link
                testID="viewHeaderHomeFeedPrefsBtn"
                to={{screen: 'Feeds'}}
                hitSlop={HITSLOP_10}
                label={_(msg`View your feeds and explore more`)}
                size="small"
                variant="ghost"
                color="secondary"
                shape="square"
                onPress={() => {
                  ax.metric('nav:click', {item: 'feeds', surface: 'topBar'})
                }}
                style={[
                  a.justify_center,
                  {marginRight: -Layout.BUTTON_VISUAL_ALIGNMENT_OFFSET},
                  a.bg_transparent,
                ]}>
                <ButtonIcon icon={FeedsIcon} size="lg" />
              </Link>
            )}
          </Layout.Header.Slot>
        </Layout.Header.Outer>
        {children}
      </Animated.View>
    </>
  )
}

/**
 * Opacity of the fade behind the status bar, down its height: e^(-4x^2),
 * rescaled to reach 0 at the bottom. It holds up behind the status bar's icons,
 * then tails off with no visible edge. Sampled, as a gradient only
 * interpolates linearly between its stops
 */
const STATUS_BAR_FADE_STOPS = Array.from({length: 11}, (_, i) => {
  const x = i / 10
  const end = Math.exp(-4)
  return {location: x, opacity: (Math.exp(-4 * x * x) - end) / (1 - end)}
})

/**
 * The background fading out from behind the status bar, as far below it as
 * it is tall.
 */
function StatusBarFade({style}: ViewStyleProp) {
  const t = useTheme()
  const {top} = useSafeAreaInsets()
  return (
    <LinearGradient
      // Android doesn't pick up new colors when the theme changes
      key={t.name}
      pointerEvents="none"
      style={[a.fixed, a.z_10, {top: 0, height: top * 2}, style]}
      start={[0.5, 0]}
      end={[0.5, 1]}
      colors={
        STATUS_BAR_FADE_STOPS.map(stop =>
          utils.alpha(t.atoms.bg.backgroundColor, stop.opacity),
        ) as [string, string, ...string[]]
      }
      locations={
        STATUS_BAR_FADE_STOPS.map(stop => stop.location) as [
          number,
          number,
          ...number[],
        ]
      }
    />
  )
}
