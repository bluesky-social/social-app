import React from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useSession} from '#/state/session'
import {useSetDrawerOpen} from '#/state/shell/drawer-open'
import {useShellLayout} from '#/state/shell/shell-layout'
import {HITSLOP_10} from 'lib/constants'
import {useMinimalShellHeaderTransform} from 'lib/hooks/useMinimalShellTransform'
import {usePalette} from 'lib/hooks/usePalette'
import {isWeb} from 'platform/detection'
// import {Logo} from '#/view/icons/Logo'
import {atoms} from '#/alf'
import {useTheme} from '#/alf'
import {atoms as a} from '#/alf'
import {Icon, Trigger} from '#/components/dialogs/nuxs/TenMillion/Trigger'
import {ColorPalette_Stroke2_Corner0_Rounded as ColorPalette} from '#/components/icons/ColorPalette'
import {Hashtag_Stroke2_Corner0_Rounded as FeedsIcon} from '#/components/icons/Hashtag'
import {Menu_Stroke2_Corner0_Rounded as Menu} from '#/components/icons/Menu'
import {Link} from '#/components/Link'
import {IS_DEV} from '#/env'

export function HomeHeaderLayoutMobile({
  children,
}: {
  children: React.ReactNode
  tabBarAnchor: JSX.Element | null | undefined
}) {
  const t = useTheme()
  const pal = usePalette('default')
  const {_} = useLingui()
  const setDrawerOpen = useSetDrawerOpen()
  const {headerHeight} = useShellLayout()
  const headerMinimalShellTransform = useMinimalShellHeaderTransform()
  const {hasSession} = useSession()

  const onPressAvi = React.useCallback(() => {
    setDrawerOpen(true)
  }, [setDrawerOpen])

  // TEMPORARY - REMOVE AFTER MILLY
  // This will just cause the icon to shake a bit when the user first opens the app, drawing attention to the celebration
  // 🎉
  const rotate = useSharedValue(0)
  const reducedMotion = useReducedMotion()

  // Run this a single time on app mount.
  React.useEffect(() => {
    if (reducedMotion) return

    // Waits 1500ms, then rotates 10 degrees with a spring animation. Repeats once.
    rotate.value = withDelay(
      1000,
      withRepeat(
        withSequence(
          withTiming(10, {duration: 100}),
          withSpring(0, {
            mass: 1,
            damping: 1,
            stiffness: 200,
            overshootClamping: false,
          }),
        ),
        2,
        false,
      ),
    )
  }, [rotate, reducedMotion])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotateZ: `${rotate.value}deg`,
      },
    ],
  }))

  return (
    <Animated.View
      style={[pal.view, pal.border, styles.tabBar, headerMinimalShellTransform]}
      onLayout={e => {
        headerHeight.value = e.nativeEvent.layout.height
      }}>
      <View style={[pal.view, styles.topBar]}>
        <View style={[pal.view, {width: 100}]}>
          <TouchableOpacity
            testID="viewHeaderDrawerBtn"
            onPress={onPressAvi}
            accessibilityRole="button"
            accessibilityLabel={_(msg`Open navigation`)}
            accessibilityHint={_(
              msg`Access profile and other navigation links`,
            )}
            hitSlop={HITSLOP_10}>
            <Menu size="lg" fill={t.atoms.text_contrast_medium.color} />
          </TouchableOpacity>
        </View>
        <Animated.View style={animatedStyle}>
          <Trigger>
            {ctx => (
              <Icon
                width={28}
                style={{
                  opacity: ctx.pressed ? 0.8 : 1,
                }}
              />
            )}
          </Trigger>
          {/* <Logo width={30} /> */}
        </Animated.View>
        <View
          style={[
            atoms.flex_row,
            atoms.justify_end,
            atoms.align_center,
            atoms.gap_md,
            pal.view,
            {width: 100},
          ]}>
          {IS_DEV && (
            <>
              <Link label="View storybook" to="/sys/debug">
                <ColorPalette size="md" />
              </Link>
            </>
          )}
          {hasSession && (
            <Link
              testID="viewHeaderHomeFeedPrefsBtn"
              to="/feeds"
              hitSlop={HITSLOP_10}
              label={_(msg`View your feeds and explore more`)}
              size="small"
              variant="ghost"
              color="secondary"
              shape="square"
              style={[
                a.justify_center,
                {
                  marginTop: 2,
                  marginRight: -6,
                },
              ]}>
              <FeedsIcon size="lg" fill={t.atoms.text_contrast_medium.color} />
            </Link>
          )}
        </View>
      </View>
      {children}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    // @ts-ignore web-only
    position: isWeb ? 'fixed' : 'absolute',
    zIndex: 1,
    left: 0,
    right: 0,
    top: 0,
    flexDirection: 'column',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 5,
    width: '100%',
    minHeight: 46,
  },
  title: {
    fontSize: 21,
  },
})
