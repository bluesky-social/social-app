import React from 'react'
import {StyleSheet, View} from 'react-native'
import Animated from 'react-native-reanimated'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {HomeHeaderLayoutMobile} from './HomeHeaderLayoutMobile'
import {useMinimalShellMode} from 'lib/hooks/useMinimalShellMode'
import {useShellLayout} from '#/state/shell/shell-layout'
import {Logo} from '#/view/icons/Logo'
import {Link, TextLink} from '../util/Link'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {useLingui} from '@lingui/react'
import {msg} from '@lingui/macro'
import {CogIcon} from '#/lib/icons'

export function HomeHeaderLayout({children}: {children: React.ReactNode}) {
  const {isMobile} = useWebMediaQueries()
  if (isMobile) {
    return <HomeHeaderLayoutMobile>{children}</HomeHeaderLayoutMobile>
  } else {
    return <HomeHeaderLayoutTablet>{children}</HomeHeaderLayoutTablet>
  }
}

function HomeHeaderLayoutTablet({children}: {children: React.ReactNode}) {
  const pal = usePalette('default')
  const {headerMinimalShellTransform} = useMinimalShellMode()
  const {headerHeight} = useShellLayout()
  const {_} = useLingui()

  return (
    // @ts-ignore the type signature for transform wrong here, translateX and translateY need to be in separate objects -prf
    <Animated.View
      style={[pal.view, pal.border, styles.tabBar, headerMinimalShellTransform]}
      onLayout={e => {
        headerHeight.value = e.nativeEvent.layout.height
      }}>
      <View style={[pal.view, styles.topBar]}>
        <TextLink
          type="title-lg"
          href="/settings/following-feed"
          accessibilityLabel={_(msg`Following Feed Preferences`)}
          accessibilityHint=""
          text={
            <FontAwesomeIcon
              icon="sliders"
              style={pal.textLight as FontAwesomeIconStyle}
            />
          }
        />
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
      {children}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginTop: 8,
    width: '100%',
  },
  tabBar: {
    // @ts-ignore Web only
    position: 'sticky',
    zIndex: 1,
    // @ts-ignore Web only -prf
    left: 'calc(50% - 300px)',
    width: 600,
    top: 0,
    flexDirection: 'column',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
})
