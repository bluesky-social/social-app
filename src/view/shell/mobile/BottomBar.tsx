import React from 'react'
import {
  Animated,
  GestureResponderEvent,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {observer} from 'mobx-react-lite'
import {Text} from 'view/com/util/text/Text'
import {useStores} from 'state/index'
import {useAnalytics} from 'lib/analytics'
import {useAnimatedValue} from 'lib/hooks/useAnimatedValue'
import {TabPurpose, TabPurposeMainPath} from 'state/models/navigation'
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

export const BottomBar = observer(() => {
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

  const onPressHome = React.useCallback(() => {
    track('MobileShell:HomeButtonPressed')
    if (store.nav.tab.fixedTabPurpose === TabPurpose.Default) {
      if (!store.nav.tab.canGoBack) {
        store.emitScreenSoftReset()
      } else {
        store.nav.tab.fixedTabReset()
      }
    } else {
      store.nav.switchTo(TabPurpose.Default, false)
      if (store.nav.tab.index === 0) {
        store.nav.tab.fixedTabReset()
      }
    }
  }, [store, track])
  const onPressSearch = React.useCallback(() => {
    track('MobileShell:SearchButtonPressed')
    if (store.nav.tab.fixedTabPurpose === TabPurpose.Search) {
      if (!store.nav.tab.canGoBack) {
        store.emitScreenSoftReset()
      } else {
        store.nav.tab.fixedTabReset()
      }
    } else {
      store.nav.switchTo(TabPurpose.Search, false)
      if (store.nav.tab.index === 0) {
        store.nav.tab.fixedTabReset()
      }
    }
  }, [store, track])
  const onPressNotifications = React.useCallback(() => {
    track('MobileShell:NotificationsButtonPressed')
    if (store.nav.tab.fixedTabPurpose === TabPurpose.Notifs) {
      if (!store.nav.tab.canGoBack) {
        store.emitScreenSoftReset()
      } else {
        store.nav.tab.fixedTabReset()
      }
    } else {
      store.nav.switchTo(TabPurpose.Notifs, false)
      if (store.nav.tab.index === 0) {
        store.nav.tab.fixedTabReset()
      }
    }
  }, [store, track])
  const onPressProfile = React.useCallback(() => {
    track('MobileShell:ProfileButtonPressed')
    store.nav.navigate(`/profile/${store.me.handle}`)
  }, [store, track])

  const isAtHome =
    store.nav.tab.current.url === TabPurposeMainPath[TabPurpose.Default]
  const isAtSearch =
    store.nav.tab.current.url === TabPurposeMainPath[TabPurpose.Search]
  const isAtNotifications =
    store.nav.tab.current.url === TabPurposeMainPath[TabPurpose.Notifs]

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
