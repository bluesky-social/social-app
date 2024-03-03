import React from 'react'
import {StyleSheet, View} from 'react-native'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {HomeHeaderLayoutMobile} from './HomeHeaderLayoutMobile'
import {Logo} from '#/view/icons/Logo'
import {Link} from '../util/Link'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {useLingui} from '@lingui/react'
import {msg} from '@lingui/macro'
import {CogIcon} from '#/lib/icons'

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
  const pal = usePalette('default')
  const {_} = useLingui()

  return (
    <>
      <View style={[pal.view, pal.border, styles.bar, styles.topBar]}>
        <Link
          href="/settings/following-feed"
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={_(msg`Following Feed Preferences`)}
          accessibilityHint="">
          <FontAwesomeIcon
            icon="sliders"
            style={pal.textLight as FontAwesomeIconStyle}
          />
        </Link>
        <Logo width={28} />
        <Link
          href="/settings/saved-feeds"
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={_(msg`Edit Saved Feeds`)}
          accessibilityHint={_(msg`Opens screen to edit Saved Feeds`)}>
          <CogIcon size={22} strokeWidth={2} style={pal.textLight} />
        </Link>
      </View>
      {tabBarAnchor}
      <View style={[pal.view, pal.border, styles.bar, styles.tabBar]}>
        {children}
      </View>
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
