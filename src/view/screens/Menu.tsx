import React, {useEffect} from 'react'
import {
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native'
import VersionNumber from 'react-native-version-number'
import {s, colors} from '../lib/styles'
import {ScreenParams} from '../routes'
import {useStores} from '../../state'
import {
  HomeIcon,
  UserGroupIcon,
  BellIcon,
  CogIcon,
  MagnifyingGlassIcon,
} from '../lib/icons'
import {UserAvatar} from '../com/util/UserAvatar'
import {ViewHeader} from '../com/util/ViewHeader'
import {CreateSceneModel} from '../../state/models/shell-ui'

export const Menu = ({navIdx, visible}: ScreenParams) => {
  const store = useStores()

  useEffect(() => {
    if (visible) {
      store.nav.setTitle(navIdx, 'Menu')
      // trigger a refresh in case memberships have changed recently
      store.me.refreshMemberships()
    }
  }, [store, visible])

  // events
  // =

  const onNavigate = (url: string) => {
    if (url === '/notifications') {
      store.nav.switchTo(1, true)
    } else {
      store.nav.switchTo(0, true)
      store.nav.navigate(url)
    }
  }
  const onPressCreateScene = () => {
    store.shell.openModal(new CreateSceneModel())
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

  /*TODO <MenuItem icon={['far', 'compass']} label="Discover" url="/" />*/
  return (
    <View style={styles.view}>
      <ViewHeader title="Bluesky" subtitle="Private Beta" />
      <TouchableOpacity
        style={styles.searchBtn}
        onPress={() => onNavigate('/search')}>
        <MagnifyingGlassIcon
          style={{color: colors.gray5} as StyleProp<ViewStyle>}
          size={21}
        />
        <Text style={styles.searchBtnLabel}>Search</Text>
      </TouchableOpacity>
      <View style={styles.section}>
        <MenuItem
          icon={
            <UserAvatar
              size={24}
              displayName={store.me.displayName}
              handle={store.me.handle}
              avatar={store.me.avatar}
            />
          }
          label={store.me.displayName || store.me.handle}
          bold
          url={`/profile/${store.me.handle}`}
        />
        <MenuItem
          icon={
            <HomeIcon
              style={{color: colors.gray5} as StyleProp<ViewStyle>}
              size="24"
            />
          }
          label="Home"
          url="/"
        />
        <MenuItem
          icon={
            <BellIcon
              style={{color: colors.gray5} as StyleProp<ViewStyle>}
              size="24"
            />
          }
          label="Notifications"
          url="/notifications"
          count={store.me.notificationCount}
        />
        <MenuItem
          icon={
            <CogIcon
              style={{color: colors.gray6} as StyleProp<ViewStyle>}
              size="24"
              strokeWidth={2}
            />
          }
          label="Settings"
          url="/settings"
        />
      </View>
      <View style={styles.section}>
        <Text style={styles.heading}>Scenes</Text>
        <MenuItem
          icon={
            <UserGroupIcon
              style={{color: colors.gray6} as StyleProp<ViewStyle>}
              size="24"
            />
          }
          label="Create a scene"
          onPress={onPressCreateScene}
        />
        {store.me.memberships
          ? store.me.memberships.memberships.map((membership, i) => (
              <MenuItem
                key={i}
                icon={
                  <UserAvatar
                    size={24}
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
    fontSize: 18,
    color: colors.gray6,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
  menuItemIconWrapper: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  menuItemLabel: {
    fontSize: 17,
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
