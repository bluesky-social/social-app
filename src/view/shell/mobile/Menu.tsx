import React from 'react'
import {
  ScrollView,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native'
import {observer} from 'mobx-react-lite'
import VersionNumber from 'react-native-version-number'
import {s, colors} from '../../lib/styles'
import {useStores} from '../../../state'
import {
  HomeIcon,
  BellIcon,
  UserIcon,
  CogIcon,
  MagnifyingGlassIcon,
} from '../../lib/icons'
import {UserAvatar} from '../../com/util/UserAvatar'
import {Text} from '../../com/util/text/Text'
import {ToggleButton} from '../../com/util/forms/ToggleButton'
import {usePalette} from '../../lib/hooks/usePalette'

export const Menu = observer(
  ({visible, onClose}: {visible: boolean; onClose: () => void}) => {
    const pal = usePalette('default')
    const store = useStores()

    // events
    // =

    const onNavigate = (url: string) => {
      onClose()
      if (url === '/notifications') {
        store.nav.switchTo(1, true)
      } else {
        store.nav.switchTo(0, true)
        if (url !== '/') {
          store.nav.navigate(url)
        }
      }
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

    return (
      <ScrollView testID="menuView" style={[styles.view, pal.view]}>
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
        <View style={[styles.section, pal.border, {paddingTop: 5}]}>
          <MenuItem
            icon={
              <HomeIcon style={pal.text as StyleProp<ViewStyle>} size="26" />
            }
            label="Home"
            url="/"
          />
          <MenuItem
            icon={
              <BellIcon style={pal.text as StyleProp<ViewStyle>} size="28" />
            }
            label="Notifications"
            url="/notifications"
            count={store.me.notificationCount}
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
            onPress={() => store.shell.setDarkMode(!store.shell.darkMode)}
          />
        </View>
        <View style={styles.footer}>
          <Text style={[pal.textLight]}>
            Build version {VersionNumber.appVersion} (
            {VersionNumber.buildVersion})
          </Text>
        </View>
        <View style={s.footerSpacer} />
      </ScrollView>
    )
  },
)

const styles = StyleSheet.create({
  view: {
    flex: 1,
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
    paddingHorizontal: 14,
    paddingVertical: 18,
  },
})
