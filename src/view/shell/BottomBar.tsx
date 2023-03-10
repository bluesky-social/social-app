import React from 'react'
import {
  Animated,
  GestureResponderEvent,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import {StackActions} from '@react-navigation/native'
import {BottomTabBarProps} from '@react-navigation/bottom-tabs'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {observer} from 'mobx-react-lite'
import {Text} from 'view/com/util/text/Text'
import {useStores} from 'state/index'
import {useAnalytics} from 'lib/analytics'
import {useAnimatedValue} from 'lib/hooks/useAnimatedValue'
import {clamp} from 'lib/numbers'
import {
  HomeIcon,
  HomeIconSolid,
  MagnifyingGlassIcon2,
  MagnifyingGlassIcon2Solid,
  BellIcon,
  BellIconSolid,
  UserIcon,
} from 'lib/icons'
import {colors} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'

// TODO move to lib
function currentRoute(state) {
  let node = state.routes[state.index]
  while (node.state?.routes && typeof node.state?.index === 'number') {
    node = node.state?.routes[node.state?.index]
  }
  return node
}

export const BottomBar = observer(({navigation}: BottomTabBarProps) => {
  const store = useStores()
  const pal = usePalette('default')
  const minimalShellInterp = useAnimatedValue(0)
  const safeAreaInsets = useSafeAreaInsets()
  const {track} = useAnalytics()

  React.useEffect(() => {
    if (store.shell.minimalShellMode) {
      Animated.timing(minimalShellInterp, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
        isInteraction: false,
      }).start()
    } else {
      Animated.timing(minimalShellInterp, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
        isInteraction: false,
      }).start()
    }
  }, [minimalShellInterp, store.shell.minimalShellMode])
  const footerMinimalShellTransform = {
    transform: [{translateY: Animated.multiply(minimalShellInterp, 100)}],
  }

  const onPressTab = React.useCallback(
    (tab: string) => {
      track(`MobileShell:${tab}ButtonPressed`)
      const state = navigation.getState()
      const curr = currentRoute(state).name
      if (curr === tab || curr === `${tab}Stack` || curr === `${tab}Inner`) {
        store.emitScreenSoftReset()
      } else if (state.routes[state.index].name === `${tab}Stack`) {
        navigation.dispatch(StackActions.popToTop())
      } else {
        navigation.navigate(`${tab}Stack`)
      }
    },
    [store, track, navigation],
  )
  const onPressHome = React.useCallback(() => onPressTab('Home'), [onPressTab])
  const onPressSearch = React.useCallback(
    () => onPressTab('Search'),
    [onPressTab],
  )
  const onPressNotifications = React.useCallback(
    () => onPressTab('Notifications'),
    [onPressTab],
  )
  const onPressProfile = React.useCallback(() => {
    track('MobileShell:ProfileButtonPressed')
    navigation.navigate('Profile', {name: store.me.handle})
  }, [navigation, track, store.me.handle])

  const curr = currentRoute(navigation.getState()).name
  const isAtHome =
    curr === 'HomeStack' || curr === 'Home' || curr === 'HomeInner'
  const isAtSearch =
    curr === 'SearchStack' || curr === 'Search' || curr === 'SearchInner'
  const isAtNotifications =
    curr === 'NotificationsStack' ||
    curr === 'Notifications' ||
    curr === 'NotificationsInner'

  return (
    <Animated.View
      style={[
        styles.bottomBar,
        pal.view,
        pal.border,
        {paddingBottom: clamp(safeAreaInsets.bottom, 15, 30)},
        footerMinimalShellTransform,
      ]}>
      <Btn
        icon={
          isAtHome ? (
            <HomeIconSolid
              strokeWidth={4}
              size={24}
              style={[styles.ctrlIcon, pal.text, styles.homeIcon]}
            />
          ) : (
            <HomeIcon
              strokeWidth={4}
              size={24}
              style={[styles.ctrlIcon, pal.text, styles.homeIcon]}
            />
          )
        }
        onPress={onPressHome}
      />
      <Btn
        icon={
          isAtSearch ? (
            <MagnifyingGlassIcon2Solid
              size={25}
              style={[styles.ctrlIcon, pal.text, styles.searchIcon]}
              strokeWidth={1.8}
            />
          ) : (
            <MagnifyingGlassIcon2
              size={25}
              style={[styles.ctrlIcon, pal.text, styles.searchIcon]}
              strokeWidth={1.8}
            />
          )
        }
        onPress={onPressSearch}
      />
      <Btn
        icon={
          isAtNotifications ? (
            <BellIconSolid
              size={24}
              strokeWidth={1.9}
              style={[styles.ctrlIcon, pal.text, styles.bellIcon]}
            />
          ) : (
            <BellIcon
              size={24}
              strokeWidth={1.9}
              style={[styles.ctrlIcon, pal.text, styles.bellIcon]}
            />
          )
        }
        onPress={onPressNotifications}
        notificationCount={store.me.notifications.unreadCount}
      />
      <Btn
        icon={
          <View style={styles.ctrlIconSizingWrapper}>
            <UserIcon
              size={28}
              strokeWidth={1.5}
              style={[styles.ctrlIcon, pal.text, styles.profileIcon]}
            />
          </View>
        }
        onPress={onPressProfile}
      />
    </Animated.View>
  )
})

function Btn({
  icon,
  notificationCount,
  onPress,
  onLongPress,
}: {
  icon: JSX.Element
  notificationCount?: number
  onPress?: (event: GestureResponderEvent) => void
  onLongPress?: (event: GestureResponderEvent) => void
}) {
  return (
    <TouchableOpacity
      style={styles.ctrl}
      onPress={onLongPress ? onPress : undefined}
      onPressIn={onLongPress ? undefined : onPress}
      onLongPress={onLongPress}>
      {notificationCount ? (
        <View style={styles.notificationCount}>
          <Text style={styles.notificationCountLabel}>{notificationCount}</Text>
        </View>
      ) : undefined}
      {icon}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingLeft: 5,
    paddingRight: 10,
  },
  ctrl: {
    flex: 1,
    paddingTop: 13,
    paddingBottom: 4,
  },
  notificationCount: {
    position: 'absolute',
    left: '52%',
    top: 10,
    backgroundColor: colors.blue3,
    paddingHorizontal: 4,
    paddingBottom: 1,
    borderRadius: 8,
    zIndex: 1,
  },
  notificationCountLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.white,
  },
  ctrlIcon: {
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  ctrlIconSizingWrapper: {
    height: 27,
  },
  homeIcon: {
    top: 0,
  },
  searchIcon: {
    top: -2,
  },
  bellIcon: {
    top: -2.5,
  },
  profileIcon: {
    top: -4,
  },
})
