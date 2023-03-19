import React from 'react'
import {Animated, StyleSheet} from 'react-native'
import {observer} from 'mobx-react-lite'
import {TabBar} from 'view/com/util/TabBar'
import {RenderTabBarFnProps} from 'view/com/util/pager/Pager'
import {useStores} from 'state/index'
import {usePalette} from 'lib/hooks/usePalette'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {useAnimatedValue} from 'lib/hooks/useAnimatedValue'
import {clamp} from 'lodash'

const BOTTOM_BAR_HEIGHT = 48

export const FeedsTabBar = observer(
  (props: RenderTabBarFnProps & {onPressSelected: () => void}) => {
    const store = useStores()
    const safeAreaInsets = useSafeAreaInsets()
    const pal = usePalette('default')
    const interp = useAnimatedValue(0)

    const pad = React.useMemo(
      () => ({
        paddingBottom: clamp(safeAreaInsets.bottom, 15, 20),
      }),
      [safeAreaInsets],
    )

    React.useEffect(() => {
      Animated.timing(interp, {
        toValue: store.shell.minimalShellMode ? 0 : 1,
        duration: 100,
        useNativeDriver: true,
        isInteraction: false,
      }).start()
    }, [interp, store.shell.minimalShellMode])
    const transform = {
      transform: [
        {translateY: Animated.multiply(interp, -1 * BOTTOM_BAR_HEIGHT)},
      ],
    }

    return (
      <Animated.View
        style={[pal.view, pal.border, styles.tabBar, pad, transform]}>
        <TabBar
          {...props}
          items={['Following', "What's hot"]}
          indicatorPosition="top"
          indicatorColor={pal.colors.link}
        />
      </Animated.View>
    )
  },
)

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderTopWidth: 1,
    paddingTop: 0,
    paddingBottom: 30,
  },
  tabBarAvi: {
    marginRight: 4,
  },
})
