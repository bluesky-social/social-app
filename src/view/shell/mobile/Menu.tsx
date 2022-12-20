import React, {useEffect} from 'react'
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native'
import VersionNumber from 'react-native-version-number'
import {s, colors} from '../../lib/styles'
import {useStores} from '../../../state'
import {
  HomeIcon,
  UserGroupIcon,
  BellIcon,
  CogIcon,
  MagnifyingGlassIcon,
} from '../../lib/icons'
import {UserAvatar} from '../../com/util/UserAvatar'
import {Text} from '../../com/util/Text'
import {CreateSceneModal} from '../../../state/models/shell-ui'

export const Menu = ({
  visible,
  onClose,
}: {
  visible: boolean
  onClose: () => void
}) => {
  const store = useStores()

  useEffect(() => {
    if (visible) {
      // trigger a refresh in case memberships have changed recently
      // TODO this impacts performance, need to find the right time to do this
      // store.me.refreshMemberships()
    }
  }, [store, visible])

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
  const onPressCreateScene = () => {
    onClose()
    store.shell.openModal(new CreateSceneModal())
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
        style={[
          styles.menuItemLabel,
          bold ? styles.menuItemLabelBold : undefined,
        ]}
        numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  )

  return (
    <View style={styles.view}>
      <TouchableOpacity
        onPress={() => onNavigate(`/profile/${store.me.handle}`)}
        style={styles.profileCard}>
        <UserAvatar
          size={60}
          displayName={store.me.displayName}
          handle={store.me.handle}
          avatar={store.me.avatar}
        />
        <View style={s.flex1}>
          <Text style={styles.profileCardDisplayName}>
            {store.me.displayName}
          </Text>
          <Text style={styles.profileCardHandle}>{store.me.handle}</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.searchBtn}
        onPress={() => onNavigate('/search')}>
        <MagnifyingGlassIcon
          style={{color: colors.gray5} as StyleProp<ViewStyle>}
          size={25}
        />
        <Text style={styles.searchBtnLabel}>Search</Text>
      </TouchableOpacity>
      <View style={styles.section}>
        <MenuItem
          icon={
            <HomeIcon
              style={{color: colors.gray6} as StyleProp<ViewStyle>}
              size="26"
            />
          }
          label="Home"
          url="/"
        />
        <MenuItem
          icon={
            <BellIcon
              style={{color: colors.gray6} as StyleProp<ViewStyle>}
              size="28"
            />
          }
          label="Notifications"
          url="/notifications"
          count={store.me.notificationCount}
        />
      </View>
      <View style={styles.section}>
        <Text style={styles.heading}>Scenes</Text>
        {store.me.memberships
          ? store.me.memberships.memberships.map((membership, i) => (
              <MenuItem
                key={i}
                icon={
                  <UserAvatar
                    size={34}
                    displayName={membership.displayName}
                    handle={membership.handle}
                    avatar={membership.avatar}
                  />
                }
                label={membership.displayName || membership.handle}
                url={`/profile/${membership.handle}`}
              />
            ))
          : undefined}
      </View>
      <View style={styles.section}>
        <MenuItem
          icon={
            <UserGroupIcon
              style={{color: colors.gray6} as StyleProp<ViewStyle>}
              size="30"
            />
          }
          label="Create a scene"
          onPress={onPressCreateScene}
        />
        <MenuItem
          icon={
            <CogIcon
              style={{color: colors.gray6} as StyleProp<ViewStyle>}
              size="30"
              strokeWidth={2}
            />
          }
          label="Settings"
          url="/settings"
        />
      </View>
      <View style={styles.footer}>
        <Text style={s.gray4}>
          Build version {VersionNumber.appVersion} ({VersionNumber.buildVersion}
          )
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  view: {
    flex: 1,
    backgroundColor: colors.white,
  },
  section: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray1,
  },
  heading: {
    fontSize: 16,
    fontWeight: 'bold',
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
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray7,
  },
  profileCardHandle: {
    marginLeft: 12,
    fontSize: 18,
    color: colors.gray6,
  },

  searchBtn: {
    flexDirection: 'row',
    backgroundColor: colors.gray1,
    borderRadius: 8,
    margin: 10,
    marginBottom: 0,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  searchBtnLabel: {
    marginLeft: 8,
    fontSize: 19,
    color: colors.gray6,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  menuItemIconWrapper: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemLabel: {
    fontSize: 19,
    color: colors.gray7,
  },
  menuItemLabelBold: {
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
