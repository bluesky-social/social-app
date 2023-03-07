import React from 'react'
import {
  Linking,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native'
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
import {TabPurpose, TabPurposeMainPath} from 'state/models/navigation'
import {UserAvatar} from '../../com/util/UserAvatar'
import {Text} from '../../com/util/text/Text'
import {useTheme} from 'lib/ThemeContext'
import {usePalette} from 'lib/hooks/usePalette'
import {useAnalytics} from 'lib/analytics'
import {pluralize} from 'lib/strings/helpers'

export const Menu = observer(({onClose}: {onClose: () => void}) => {
  const theme = useTheme()
  const pal = usePalette('default')
  const store = useStores()
  const {track} = useAnalytics()

  // events
  // =

  const onNavigate = (url: string) => {
    track('Menu:ItemClicked', {url})

    onClose()
    if (url === TabPurposeMainPath[TabPurpose.Notifs]) {
      store.nav.switchTo(TabPurpose.Notifs, true)
    } else if (url === TabPurposeMainPath[TabPurpose.Search]) {
      store.nav.switchTo(TabPurpose.Search, true)
    } else {
      store.nav.switchTo(TabPurpose.Default, true)
      if (url !== '/') {
        store.nav.navigate(url)
      }
    }
  }

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
    url,
    bold,
    onPress,
  }: {
    icon: JSX.Element
    label: string
    count?: number
    url?: string
    bold?: boolean
    onPress?: () => void
  }) => (
    <TouchableOpacity
      testID={`menuItemButton-${label}`}
      style={styles.menuItem}
      onPress={onPress ? onPress : () => onNavigate(url || '/')}>
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

  const isAtHome =
    store.nav.tab.current.url === TabPurposeMainPath[TabPurpose.Default]
  const isAtSearch =
    store.nav.tab.current.url === TabPurposeMainPath[TabPurpose.Search]
  const isAtNotifications =
    store.nav.tab.current.url === TabPurposeMainPath[TabPurpose.Notifs]

  return (
    <View
      testID="menuView"
      style={[
        styles.view,
        theme.colorScheme === 'light' ? pal.view : styles.viewDarkMode,
      ]}>
      <TouchableOpacity
        testID="profileCardButton"
        onPress={() => onNavigate(`/profile/${store.me.handle}`)}>
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
          url="/search"
          bold={isAtSearch}
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
          url="/"
          bold={isAtHome}
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
          url="/notifications"
          count={store.me.notifications.unreadCount}
          bold={isAtNotifications}
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
          url={`/profile/${store.me.handle}`}
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
          url="/settings"
        />
      </View>
      <View style={s.flex1} />
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={onDarkmodePress}
          style={[
            styles.footerBtn,
            theme.colorScheme === 'light' ? pal.btn : styles.footerBtnDarkMode,
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
    paddingRight: 20,
  },
  profileCardHandle: {
    marginTop: 4,
    paddingRight: 20,
  },
  profileCardFollowers: {
    marginTop: 16,
    paddingRight: 20,
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
