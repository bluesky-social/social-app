import React from 'react'
import {StyleSheet} from 'react-native'
import Animated from 'react-native-reanimated'
import {observer} from 'mobx-react-lite'
import {TabBar} from 'view/com/pager/TabBar'
import {RenderTabBarFnProps} from 'view/com/pager/Pager'
import {useStores} from 'state/index'
import {useHomeTabs} from 'lib/hooks/useHomeTabs'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {FeedsTabBar as FeedsTabBarMobile} from './FeedsTabBarMobile'
import {useMinimalShellMode} from 'lib/hooks/useMinimalShellMode'
import {useShellLayout} from '#/state/shell/shell-layout'

export const FeedsTabBar = observer(function FeedsTabBarImpl(
  props: RenderTabBarFnProps & {testID?: string; onPressSelected: () => void},
) {
  const {isMobile, isTablet} = useWebMediaQueries()
  if (isMobile) {
    return <FeedsTabBarMobile {...props} />
  } else if (isTablet) {
    return <FeedsTabBarTablet {...props} />
  } else {
    return null
  }
})

const FeedsTabBarTablet = observer(function FeedsTabBarTabletImpl(
  props: RenderTabBarFnProps & {testID?: string; onPressSelected: () => void},
) {
  const store = useStores()
  const items = useHomeTabs(store.preferences.pinnedFeeds)
  const pal = usePalette('default')
  const {headerMinimalShellTransform} = useMinimalShellMode()
  const {headerHeight} = useShellLayout()

  return (
    // @ts-ignore the type signature for transform wrong here, translateX and translateY need to be in separate objects -prf
    <Animated.View
      style={[pal.view, styles.tabBar, headerMinimalShellTransform]}
      onLayout={e => {
        headerHeight.value = e.nativeEvent.layout.height
      }}>
      <TabBar
        key={items.join(',')}
        {...props}
        items={items}
        indicatorColor={pal.colors.link}
      />
    </Animated.View>
  )
})

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    zIndex: 1,
    // @ts-ignore Web only -prf
    left: 'calc(50% - 299px)',
    width: 598,
    top: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
})
