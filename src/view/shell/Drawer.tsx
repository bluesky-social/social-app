import React from 'react'
import {
  Linking,
  SafeAreaView,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native'
import {
  DrawerContentComponentProps,
  useDrawerStatus,
} from '@react-navigation/drawer'
import {StackActions} from '@react-navigation/native'
import {observer} from 'mobx-react-lite'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {s, colors} from 'lib/styles'
import {FEEDBACK_FORM_URL} from 'lib/constants'
import {useStores} from 'state/index'
import {
  HomeIcon,
  HomeIconSolid,
  BellIcon,
  BellIconSolid,
  UserIcon,
  CogIcon,
  MagnifyingGlassIcon2,
  MagnifyingGlassIcon2Solid,
  MoonIcon,
} from 'lib/icons'
import {UserAvatar} from 'view/com/util/UserAvatar'
import {Text} from 'view/com/util/text/Text'
import {useTheme} from 'lib/ThemeContext'
import {usePalette} from 'lib/hooks/usePalette'
import {useAnalytics} from 'lib/analytics'
import {pluralize} from 'lib/strings/helpers'

// TODO move to lib
function currentRoute(state) {
  let node = state.routes[state.index]
  while (node.state?.routes && typeof node.state?.index === 'number') {
    node = node.state?.routes[node.state?.index]
  }
  return node
}

export const Drawer = observer(({navigation}: DrawerContentComponentProps) => {
  const theme = useTheme()
  const pal = usePalette('default')
  const store = useStores()
  const {track} = useAnalytics()
  const isDrawerOpen = useDrawerStatus() === 'open'

  // events
  // =

  React.useEffect(() => {
    console.log('Drawer', isDrawerOpen ? 'minimizing' : 'unminimizing', 'shell')
    store.shell.setMinimalShellMode(isDrawerOpen)
  }, [isDrawerOpen, store])

  const onPressTab = React.useCallback(
    (tab: string) => {
      track('Menu:ItemClicked', {url: tab})
      const state = navigation.getState()
      navigation.closeDrawer()
      const curr = currentRoute(state).name
      if (curr === tab || curr === `${tab}Stack`) {
        store.emitScreenSoftReset()
      } else if (state.routes[state.index].name === `${tab}Stack`) {
        navigation.dispatch(StackActions.popToTop())
      } else {
        // wait for drawer anim to finish
        setTimeout(() => {
          navigation.navigate(`${tab}Stack`)
        }, 250)
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
    track('Menu:ItemClicked', {url: 'Profile'})
    navigation.navigate('Profile', {name: store.me.handle})
    navigation.closeDrawer()
  }, [navigation, track, store.me.handle])

  const onPressSettings = React.useCallback(() => {
    track('Menu:ItemClicked', {url: 'Settings'})
    navigation.navigate('Settings')
    navigation.closeDrawer()
  }, [navigation, track])

  const onPressFeedback = () => {
    track('Menu:FeedbackClicked')
    Linking.openURL(FEEDBACK_FORM_URL)
  }

  // rendering
  // =

  const MenuItem = ({
    icon,
    label,
    count,
    bold,
    onPress,
  }: {
    icon: JSX.Element
    label: string
    count?: number
    bold?: boolean
    onPress: () => void
  }) => (
    <TouchableOpacity
      testID={`menuItemButton-${label}`}
      style={styles.menuItem}
      onPress={onPress}>
      <View style={[styles.menuItemIconWrapper]}>
        {icon}
        {count ? (
          <View style={styles.menuItemCount}>
            <Text style={styles.menuItemCountLabel}>{count}</Text>
          </View>
        ) : undefined}
      </View>
      <Text
        type={bold ? '2xl-bold' : '2xl'}
        style={[pal.text, s.flex1]}
        numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  )

  const onDarkmodePress = () => {
    track('Menu:ItemClicked', {url: '/darkmode'})
    store.shell.setDarkMode(!store.shell.darkMode)
  }

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
    <View
      testID="menuView"
      style={[
        styles.view,
        theme.colorScheme === 'light' ? pal.view : styles.viewDarkMode,
      ]}>
      <SafeAreaView style={s.flex1}>
        <TouchableOpacity testID="profileCardButton" onPress={onPressProfile}>
          <UserAvatar
            size={80}
            displayName={store.me.displayName}
            handle={store.me.handle}
            avatar={store.me.avatar}
          />
          <Text
            type="title-lg"
            style={[pal.text, s.bold, styles.profileCardDisplayName]}>
            {store.me.displayName || store.me.handle}
          </Text>
          <Text type="2xl" style={[pal.textLight, styles.profileCardHandle]}>
            @{store.me.handle}
          </Text>
          <Text type="xl" style={[pal.textLight, styles.profileCardFollowers]}>
            <Text type="xl-medium" style={pal.text}>
              {store.me.followersCount || 0}
            </Text>{' '}
            {pluralize(store.me.followersCount || 0, 'follower')} &middot;{' '}
            <Text type="xl-medium" style={pal.text}>
              {store.me.followsCount || 0}
            </Text>{' '}
            following
          </Text>
        </TouchableOpacity>
        <View style={s.flex1} />
        <View>
          <MenuItem
            icon={
              isAtSearch ? (
                <MagnifyingGlassIcon2Solid
                  style={pal.text as StyleProp<ViewStyle>}
                  size={24}
                  strokeWidth={1.7}
                />
              ) : (
                <MagnifyingGlassIcon2
                  style={pal.text as StyleProp<ViewStyle>}
                  size={24}
                  strokeWidth={1.7}
                />
              )
            }
            label="Search"
            bold={isAtSearch}
            onPress={onPressSearch}
          />
          <MenuItem
            icon={
              isAtHome ? (
                <HomeIconSolid
                  style={pal.text as StyleProp<ViewStyle>}
                  size="24"
                  strokeWidth={3.25}
                  fillOpacity={1}
                />
              ) : (
                <HomeIcon
                  style={pal.text as StyleProp<ViewStyle>}
                  size="24"
                  strokeWidth={3.25}
                />
              )
            }
            label="Home"
            bold={isAtHome}
            onPress={onPressHome}
          />
          <MenuItem
            icon={
              isAtNotifications ? (
                <BellIconSolid
                  style={pal.text as StyleProp<ViewStyle>}
                  size="24"
                  strokeWidth={1.7}
                  fillOpacity={1}
                />
              ) : (
                <BellIcon
                  style={pal.text as StyleProp<ViewStyle>}
                  size="24"
                  strokeWidth={1.7}
                />
              )
            }
            label="Notifications"
            count={store.me.notifications.unreadCount}
            bold={isAtNotifications}
            onPress={onPressNotifications}
          />
          <MenuItem
            icon={
              <UserIcon
                style={pal.text as StyleProp<ViewStyle>}
                size="26"
                strokeWidth={1.5}
              />
            }
            label="Profile"
            onPress={onPressProfile}
          />
          <MenuItem
            icon={
              <CogIcon
                style={pal.text as StyleProp<ViewStyle>}
                size="26"
                strokeWidth={1.75}
              />
            }
            label="Settings"
            onPress={onPressSettings}
          />
        </View>
        <View style={s.flex1} />
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={onDarkmodePress}
            style={[
              styles.footerBtn,
              theme.colorScheme === 'light'
                ? pal.btn
                : styles.footerBtnDarkMode,
            ]}>
            <MoonIcon
              size={22}
              style={pal.text as StyleProp<ViewStyle>}
              strokeWidth={2}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onPressFeedback}
            style={[
              styles.footerBtn,
              styles.footerBtnFeedback,
              theme.colorScheme === 'light'
                ? styles.footerBtnFeedbackLight
                : styles.footerBtnFeedbackDark,
            ]}>
            <FontAwesomeIcon
              style={pal.link as FontAwesomeIconStyle}
              size={19}
              icon={['far', 'message']}
            />
            <Text type="2xl-medium" style={[pal.link, s.pl10]}>
              Feedback
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  )
})

const styles = StyleSheet.create({
  view: {
    flex: 1,
    paddingTop: 20,
    paddingBottom: 50,
    paddingLeft: 30,
  },
  viewDarkMode: {
    backgroundColor: '#1B1919',
  },

  profileCardDisplayName: {
    marginTop: 20,
    paddingRight: 30,
  },
  profileCardHandle: {
    marginTop: 4,
    paddingRight: 30,
  },
  profileCardFollowers: {
    marginTop: 16,
    paddingRight: 30,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingRight: 10,
  },
  menuItemIconWrapper: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemCount: {
    position: 'absolute',
    right: -6,
    top: -2,
    backgroundColor: colors.red3,
    paddingHorizontal: 4,
    paddingBottom: 1,
    borderRadius: 6,
  },
  menuItemCountLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.white,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingRight: 30,
    paddingTop: 80,
  },
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 25,
  },
  footerBtnDarkMode: {
    backgroundColor: colors.black,
  },
  footerBtnFeedback: {
    paddingHorizontal: 24,
  },
  footerBtnFeedbackLight: {
    backgroundColor: '#DDEFFF',
  },
  footerBtnFeedbackDark: {
    backgroundColor: colors.blue6,
  },
})
