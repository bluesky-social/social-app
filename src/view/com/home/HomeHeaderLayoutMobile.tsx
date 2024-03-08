import React from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {usePalette} from 'lib/hooks/usePalette'
import {Link} from '../util/Link'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {FontAwesomeIconStyle} from '@fortawesome/react-native-fontawesome'
import {HITSLOP_10} from 'lib/constants'
import Animated from 'react-native-reanimated'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useMinimalShellMode} from 'lib/hooks/useMinimalShellMode'
import {useSetDrawerOpen} from '#/state/shell/drawer-open'
import {useShellLayout} from '#/state/shell/shell-layout'
import {isWeb} from 'platform/detection'
import {Logo} from '#/view/icons/Logo'

import {IS_DEV} from '#/env'
import {atoms} from '#/alf'
import {Link as Link2} from '#/components/Link'
import {ColorPalette_Stroke2_Corner0_Rounded as ColorPalette} from '#/components/icons/ColorPalette'

export function HomeHeaderLayoutMobile({
  children,
}: {
  children: React.ReactNode
  tabBarAnchor: JSX.Element | null | undefined
}) {
  const pal = usePalette('default')
  const {_} = useLingui()
  const setDrawerOpen = useSetDrawerOpen()
  const {headerHeight} = useShellLayout()
  const {headerMinimalShellTransform} = useMinimalShellMode()

  const onPressAvi = React.useCallback(() => {
    setDrawerOpen(true)
  }, [setDrawerOpen])

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
            <FontAwesomeIcon
              icon="bars"
              size={18}
              color={pal.colors.textLight}
            />
          </TouchableOpacity>
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
            pal.view,
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
              style={pal.textLight as FontAwesomeIconStyle}
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
