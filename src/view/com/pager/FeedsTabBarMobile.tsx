import React, {useMemo} from 'react'
import {Animated, StyleSheet, TouchableOpacity, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {TabBar} from 'view/com/pager/TabBar'
import {RenderTabBarFnProps} from 'view/com/pager/Pager'
import {UserAvatar} from '../util/UserAvatar'
import {useStores} from 'state/index'
import {usePalette} from 'lib/hooks/usePalette'
import {useAnimatedValue} from 'lib/hooks/useAnimatedValue'
import {Link} from '../util/Link'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'

export const FeedsTabBar = observer(
  (
    props: RenderTabBarFnProps & {testID?: string; onPressSelected: () => void},
  ) => {
    const store = useStores()
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
      transform: [{translateY: Animated.multiply(interp, -100)}],
    }

    const onPressAvi = React.useCallback(() => {
      store.shell.openDrawer()
    }, [store])

    const items = useMemo(
      () => ['Following', ...store.me.savedFeeds.pinnedFeedNames],
      [store.me.savedFeeds.pinnedFeedNames],
    )

    return (
      <Animated.View style={[pal.view, pal.border, styles.tabBar, transform]}>
        <View style={[pal.view, styles.topBar]}>
          <View style={[pal.view]}>
            <TouchableOpacity
              testID="viewHeaderDrawerBtn"
              style={styles.tabBarAvi}
              onPress={onPressAvi}
              accessibilityRole="button"
              accessibilityLabel="Open navigation"
              accessibilityHint="Access profile and other navigation links">
              <UserAvatar avatar={store.me.avatar} size={30} />
            </TouchableOpacity>
          </View>
          <View style={[pal.view]}>
            <Link href="/settings/saved-feeds">
              <FontAwesomeIcon
                icon="satellite-dish"
                size={24}
                color={pal.colors.link}
              />
            </Link>
          </View>
        </View>
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    width: '100%',
  },
  tabBar: {
    position: 'absolute',
    zIndex: 1,
    left: 0,
    right: 0,
    top: 0,
    flexDirection: 'column',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  tabBarAvi: {
    marginTop: 1,
    marginRight: 18,
  },
})
