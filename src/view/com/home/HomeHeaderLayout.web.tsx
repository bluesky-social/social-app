import React from 'react'
import {StyleSheet, View} from 'react-native'
import Animated from 'react-native-reanimated'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useMinimalShellHeaderTransform} from '#/lib/hooks/useMinimalShellTransform'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {useKawaiiMode} from '#/state/preferences/kawaii'
import {useSession} from '#/state/session'
import {useShellLayout} from '#/state/shell/shell-layout'
import {Logo} from '#/view/icons/Logo'
import {atoms as a, useTheme} from '#/alf'
import {Hashtag_Stroke2_Corner0_Rounded as FeedsIcon} from '#/components/icons/Hashtag'
import {Link} from '#/components/Link'
import {HomeHeaderLayoutMobile} from './HomeHeaderLayoutMobile'

export function HomeHeaderLayout(props: {
  children: React.ReactNode
  tabBarAnchor: JSX.Element | null | undefined
}) {
  const {isMobile} = useWebMediaQueries()
  if (isMobile) {
    return <HomeHeaderLayoutMobile {...props} />
  } else {
    return <HomeHeaderLayoutDesktopAndTablet {...props} />
  }
}

function HomeHeaderLayoutDesktopAndTablet({
  children,
  tabBarAnchor,
}: {
  children: React.ReactNode
  tabBarAnchor: JSX.Element | null | undefined
}) {
  const t = useTheme()
  const headerMinimalShellTransform = useMinimalShellHeaderTransform()
  const {headerHeight} = useShellLayout()
  const {hasSession} = useSession()
  const {_} = useLingui()
  const kawaii = useKawaiiMode()

  return (
    <>
      {hasSession && (
        <View
          style={[
            a.relative,
            a.flex_row,
            a.justify_end,
            a.align_center,
            a.pt_lg,
            a.px_md,
            a.pb_2xs,
            t.atoms.bg,
            t.atoms.border_contrast_low,
            styles.bar,
            kawaii && {paddingTop: 22, paddingBottom: 16},
          ]}>
          <View
            style={[
              a.absolute,
              a.inset_0,
              a.pt_lg,
              a.m_auto,
              kawaii && {paddingTop: 4, paddingBottom: 0},
              {
                width: kawaii ? 84 : 28,
              },
            ]}>
            <Logo width={kawaii ? 60 : 28} />
          </View>

          <Link
            to="/feeds"
            hitSlop={10}
            label={_(msg`View your feeds and explore more`)}
            size="small"
            variant="ghost"
            color="secondary"
            shape="square"
            style={[
              a.justify_center,
              {
                marginTop: -4,
              },
            ]}>
            <FeedsIcon size="md" fill={t.atoms.text_contrast_medium.color} />
          </Link>
        </View>
      )}
      {tabBarAnchor}
      <Animated.View
        onLayout={e => {
          headerHeight.set(e.nativeEvent.layout.height)
        }}
        style={[
          t.atoms.bg,
          t.atoms.border_contrast_low,
          styles.bar,
          styles.tabBar,
          headerMinimalShellTransform,
        ]}>
        {children}
      </Animated.View>
    </>
  )
}

const styles = StyleSheet.create({
  bar: {
    // @ts-ignore Web only
    left: 'calc(50% - 300px)',
    width: 600,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 8,
  },
  tabBar: {
    // @ts-ignore Web only
    position: 'sticky',
    top: 0,
    flexDirection: 'column',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    zIndex: 1,
  },
})
