import React from 'react'
import {
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native'
import Animated from 'react-native-reanimated'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useSetDrawerOpen} from '#/state/shell/drawer-open'
import {useShellLayout} from '#/state/shell/shell-layout'
import {HITSLOP_10} from 'lib/constants'
import {useMinimalShellMode} from 'lib/hooks/useMinimalShellMode'
import {isNativeTablet, isWeb} from 'platform/detection'
import {Logo} from '#/view/icons/Logo'
import {atoms, useTheme} from '#/alf'
import {ColorPalette_Stroke2_Corner0_Rounded as ColorPalette} from '#/components/icons/ColorPalette'
import {Link as Link2} from '#/components/Link'
import {IS_DEV} from '#/env'
import {Link} from '../util/Link'

export function HomeHeaderLayoutMobile({
  children,
}: {
  children: React.ReactNode
  tabBarAnchor: JSX.Element | null | undefined
}) {
  const {_} = useLingui()
  const setDrawerOpen = useSetDrawerOpen()
  const {headerHeight} = useShellLayout()
  const {headerMinimalShellTransform} = useMinimalShellMode()
  const {width} = useWindowDimensions()
  const t = useTheme()

  let tabBarTablet
  if (isNativeTablet && width > 677) {
    tabBarTablet = {
      marginLeft: (width - 600) / 2,
      width: 600,
      borderLeftWidth: 1,
      borderRightWidth: 1,
    }
  }

  const onPressAvi = React.useCallback(() => {
    setDrawerOpen(true)
  }, [setDrawerOpen])

  return (
    <Animated.View
      style={[
        t.atoms.bg,
        t.atoms.border_contrast_medium,
        styles.tabBar,
        tabBarTablet,
        headerMinimalShellTransform,
      ]}
      onLayout={e => {
        headerHeight.value = e.nativeEvent.layout.height
      }}>
      <View style={[t.atoms.bg, styles.topBar]}>
        <View style={[t.atoms.bg, {width: 100}]}>
          {!isNativeTablet ? (
            <TouchableOpacity
              testID="viewHeaderDrawerBtn"
              onPress={onPressAvi}
              accessibilityRole="button"
              accessibilityLabel={_(msg`Open navigation`)}
              accessibilityHint={_(
                msg`Access profile and other navigation links`,
              )}
              hitSlop={HITSLOP_10}>
              <FontAwesomeIcon
                icon="bars"
                size={18}
                color={t.atoms.text_contrast_medium.color}
              />
            </TouchableOpacity>
          ) : null}
        </View>
        <View>
          <Logo width={30} />
        </View>
        <View
          style={[
            atoms.flex_row,
            atoms.justify_end,
            atoms.align_center,
            atoms.gap_md,
            t.atoms.bg,
            {width: 100},
          ]}>
          {IS_DEV && (
            <Link2 to="/sys/debug">
              <ColorPalette size="md" />
            </Link2>
          )}
          <Link
            testID="viewHeaderHomeFeedPrefsBtn"
            href="/settings/following-feed"
            hitSlop={HITSLOP_10}
            accessibilityRole="button"
            accessibilityLabel={_(msg`Following Feed Preferences`)}
            accessibilityHint="">
            <FontAwesomeIcon
              icon="sliders"
              color={t.atoms.text_contrast_medium.color}
            />
          </Link>
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
    paddingHorizontal: 18,
    paddingVertical: 8,
    width: '100%',
  },
  title: {
    fontSize: 21,
  },
})
