import React, {useMemo} from 'react'
import {Animated, StyleSheet, TouchableOpacity, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {TabBar} from 'view/com/pager/TabBar'
import {RenderTabBarFnProps} from 'view/com/pager/Pager'
import {useStores} from 'state/index'
import {usePalette} from 'lib/hooks/usePalette'
import {useAnimatedValue} from 'lib/hooks/useAnimatedValue'
import {useColorSchemeStyle} from 'lib/hooks/useColorSchemeStyle'
import {Link} from '../util/Link'
import {Text} from '../util/text/Text'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {FontAwesomeIconStyle} from '@fortawesome/react-native-fontawesome'
import {s} from 'lib/styles'
import {HITSLOP_10} from 'lib/constants'

export const FeedsTabBar = observer(function FeedsTabBarImpl(
  props: RenderTabBarFnProps & {testID?: string; onPressSelected: () => void},
) {
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

  const brandBlue = useColorSchemeStyle(s.brandBlue, s.blue3)

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
            onPress={onPressAvi}
            accessibilityRole="button"
            accessibilityLabel="Open navigation"
            accessibilityHint="Access profile and other navigation links"
            hitSlop={HITSLOP_10}>
            <FontAwesomeIcon
              icon="bars"
              size={18}
              color={pal.colors.textLight}
            />
          </TouchableOpacity>
        </View>
        <Text style={[brandBlue, s.bold, styles.title]}>
          {store.session.isSandbox ? 'SANDBOX' : 'Bluesky'}
        </Text>
        <View style={[pal.view]}>
          <Link
            href="/settings/home-feed"
            hitSlop={HITSLOP_10}
            accessibilityRole="button"
            accessibilityLabel="Home Feed Preferences"
            accessibilityHint="">
            <FontAwesomeIcon
              icon="sliders"
              style={pal.textLight as FontAwesomeIconStyle}
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
})

const styles = StyleSheet.create({
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 2,
    width: '100%',
  },
  title: {
    fontSize: 21,
  },
})
