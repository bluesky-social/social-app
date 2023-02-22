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
  BellIcon,
  UserIcon,
  CogIcon,
  MagnifyingGlassIcon,
} from 'lib/icons'
import {TabPurpose, TabPurposeMainPath} from 'state/models/navigation'
import {UserAvatar} from '../../com/util/UserAvatar'
import {Text} from '../../com/util/text/Text'
import {ToggleButton} from '../../com/util/forms/ToggleButton'
import {usePalette} from 'lib/hooks/usePalette'
import {useAnalytics} from 'lib/analytics'

export const Menu = observer(({onClose}: {onClose: () => void}) => {
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
        type="title"
        style={[
          pal.text,
          bold ? styles.menuItemLabelBold : styles.menuItemLabel,
        ]}
        numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  )

  const onDarkmodePress = () => {
    track('Menu:ItemClicked', {url: '/darkmode'})
    store.shell.setDarkMode(!store.shell.darkMode)
  }

  return (
    <View
      testID="menuView"
      style={[
        styles.view,
        pal.view,
        store.shell.minimalShellMode && styles.viewMinimalShell,
      ]}>
      <TouchableOpacity
        testID="profileCardButton"
        onPress={() => onNavigate(`/profile/${store.me.handle}`)}
        style={styles.profileCard}>
        <UserAvatar
          size={60}
          displayName={store.me.displayName}
          handle={store.me.handle}
          avatar={store.me.avatar}
        />
        <View style={s.flex1}>
          <Text
            type="title-lg"
            style={[pal.text, styles.profileCardDisplayName]}
            numberOfLines={1}>
            {store.me.displayName || store.me.handle}
          </Text>
          <Text
            style={[pal.textLight, styles.profileCardHandle]}
            numberOfLines={1}>
            @{store.me.handle}
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        testID="searchBtn"
        style={[styles.searchBtn, pal.btn]}
        onPress={() => onNavigate('/search')}>
        <MagnifyingGlassIcon
          style={pal.text as StyleProp<ViewStyle>}
          size={25}
        />
        <Text type="title" style={[pal.text, styles.searchBtnLabel]}>
          Search
        </Text>
      </TouchableOpacity>
      <View style={[styles.section, pal.border, s.pt5]}>
        <MenuItem
          icon={<HomeIcon style={pal.text as StyleProp<ViewStyle>} size="26" />}
          label="Home"
          url="/"
        />
        <MenuItem
          icon={<BellIcon style={pal.text as StyleProp<ViewStyle>} size="28" />}
          label="Notifications"
          url="/notifications"
          count={store.me.notifications.unreadCount}
        />
        <MenuItem
          icon={
            <UserIcon
              style={pal.text as StyleProp<ViewStyle>}
              size="30"
              strokeWidth={2}
            />
          }
          label="Profile"
          url={`/profile/${store.me.handle}`}
        />
        <MenuItem
          icon={
            <CogIcon
              style={pal.text as StyleProp<ViewStyle>}
              size="30"
              strokeWidth={2}
            />
          }
          label="Settings"
          url="/settings"
        />
      </View>
      <View style={[styles.section, pal.border]}>
        <ToggleButton
          label="Dark mode"
          isSelected={store.shell.darkMode}
          onPress={onDarkmodePress}
        />
      </View>
      <View style={s.flex1} />
      <View style={styles.footer}>
        <MenuItem
          icon={
            <FontAwesomeIcon
              style={pal.text as FontAwesomeIconStyle}
              size={24}
              icon={['far', 'message']}
            />
          }
          label="Feedback"
          onPress={onPressFeedback}
        />
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  view: {
    flex: 1,
    paddingBottom: 90,
  },
  viewMinimalShell: {
    paddingBottom: 50,
  },
  section: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  heading: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 10,
    marginBottom: 6,
  },
  profileCardDisplayName: {
    marginLeft: 12,
  },
  profileCardHandle: {
    marginLeft: 12,
  },

  searchBtn: {
    flexDirection: 'row',
    borderRadius: 8,
    margin: 10,
    marginBottom: 0,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  searchBtnLabel: {
    marginLeft: 14,
    fontWeight: 'normal',
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 10,
  },
  menuItemIconWrapper: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemLabel: {
    flex: 1,
    fontWeight: 'normal',
  },
  menuItemLabelBold: {
    flex: 1,
    fontWeight: 'bold',
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
    paddingHorizontal: 10,
  },
})
