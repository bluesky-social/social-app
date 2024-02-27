import React from 'react'
import {StyleSheet, View} from 'react-native'
import Animated from 'react-native-reanimated'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {HomeHeaderLayoutMobile} from './HomeHeaderLayoutMobile'
import {useMinimalShellMode} from 'lib/hooks/useMinimalShellMode'
import {useShellLayout} from '#/state/shell/shell-layout'
import {Logo} from '#/view/icons/Logo'

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

  return (
    // @ts-ignore the type signature for transform wrong here, translateX and translateY need to be in separate objects -prf
    <Animated.View
      style={[pal.view, pal.border, styles.tabBar, headerMinimalShellTransform]}
      onLayout={e => {
        headerHeight.value = e.nativeEvent.layout.height
      }}>
      <View style={[pal.view, styles.topBar]}>
        <Logo width={30} />
      </View>
      {children}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 18,
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
