import {Animated, StyleSheet} from 'react-native'
import React, {useMemo} from 'react'

import {FeedsTabBar as FeedsTabBarMobile} from './FeedsTabBarMobile'
import {RenderTabBarFnProps} from 'view/com/pager/Pager'
import {TabBar} from 'view/com/pager/TabBar'
import {observer} from 'mobx-react-lite'
import {useAnimatedValue} from 'lib/hooks/useAnimatedValue'
import {usePalette} from 'lib/hooks/usePalette'
import {useStores} from 'state/index'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'

export const FeedsTabBar = observer(
  (
    props: RenderTabBarFnProps & {testID?: string; onPressSelected: () => void},
  ) => {
    const {isDesktop} = useWebMediaQueries()
    if (!isDesktop) {
      return <FeedsTabBarMobile {...props} />
    } else {
      return <FeedsTabBarDesktop {...props} />
    }
  },
)

const FeedsTabBarDesktop = observer(
  (
    props: RenderTabBarFnProps & {testID?: string; onPressSelected: () => void},
  ) => {
    const store = useStores()
    console.log(
      'store.me.savedFeeds.pinnedFeedNames',
      store.me.savedFeeds.pinnedFeedNames,
    )
    const items = useMemo(
      () => ['Home', ...store.me.savedFeeds.pinnedFeedNames],
      [store.me.savedFeeds.pinnedFeedNames],
    )
    const pal = usePalette('default')
    const interp = useAnimatedValue(0)

    React.useEffect(() => {
      Animated.timing(interp, {
        toValue: store.shell.minimalShellMode ? 1 : 0,
        duration: 100,
        useNativeDriver: true,
        isInteraction: false,
      }).start()
    }, [interp, store.shell.minimalShellMode])
    const transform = {
      transform: [
        {translateX: '-50%'},
        {translateY: Animated.multiply(interp, -100)},
      ],
    }

    return (
      // @ts-ignore the type signature for transform wrong here, translateX and translateY need to be in separate objects -prf
      <Animated.View style={[pal.view, styles.tabBar, transform]}>
        <TabBar
          key={items.join(',')}
          {...props}
          items={items}
          indicatorColor={pal.colors.link}
        />
      </Animated.View>
    )
  },
)

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    zIndex: 1,
    left: '50%',
    width: 598,
    top: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabBarAvi: {
    marginTop: 1,
    marginRight: 18,
  },
})
