import React from 'react'
import {observer} from 'mobx-react-lite'
import {StyleSheet, View} from 'react-native'
import {useNavigationState} from '@react-navigation/native'
import {Text} from 'view/com/util/text/Text'
import {UserAvatar} from 'view/com/util/UserAvatar'
import {Link} from 'view/com/util/Link'
import {usePalette} from 'lib/hooks/usePalette'
import {useStores} from 'state/index'
import {s, colors} from 'lib/styles'
import {
  HomeIcon,
  HomeIconSolid,
  MagnifyingGlassIcon2,
  MagnifyingGlassIcon2Solid,
  BellIcon,
  BellIconSolid,
  UserIcon,
  UserIconSolid,
  CogIcon,
  CogIconSolid,
} from 'lib/icons'
import {getCurrentRoute, isTab} from 'lib/routes/helpers'
import {router} from '../../../routes'

const ProfileCard = observer(() => {
  const store = useStores()
  return (
    <Link href={`/profile/${store.me.handle}`} style={styles.profileCard}>
      <UserAvatar
        handle={store.me.handle}
        displayName={store.me.displayName}
        avatar={store.me.avatar}
        size={64}
      />
    </Link>
  )
})

interface NavItemProps {
  count?: number
  href: string
  icon: JSX.Element
  iconFilled: JSX.Element
  label: string
}
const NavItem = observer(
  ({count, href, icon, iconFilled, label}: NavItemProps) => {
    const [pathName] = React.useMemo(() => router.matchPath(href), [href])
    const currentRouteName = useNavigationState(state => {
      if (!state) {
        return 'Home'
      }
      return getCurrentRoute(state).name
    })
    const isCurrent = isTab(currentRouteName, pathName)

    return (
      <Link href={href} style={styles.navItem}>
        <View style={[styles.navItemIconWrapper]}>
          {isCurrent ? iconFilled : icon}
          {typeof count === 'number' && count > 0 && (
            <Text type="button" style={styles.navItemCount}>
              {count}
            </Text>
          )}
        </View>
        <Text type="title" style={isCurrent ? s.bold : s.normal}>
          {label}
        </Text>
      </Link>
    )
  },
)

export const DesktopLeftNav = observer(function DesktopLeftNav() {
  const store = useStores()
  const pal = usePalette('default')

  return (
    <View style={[styles.leftNav, pal.view]}>
      <ProfileCard />
      <NavItem
        href="/"
        icon={<HomeIcon size={24} />}
        iconFilled={<HomeIconSolid strokeWidth={4} size={24} />}
        label="Home"
      />
      <NavItem
        href="/search"
        icon={<MagnifyingGlassIcon2 strokeWidth={2} size={24} />}
        iconFilled={<MagnifyingGlassIcon2Solid strokeWidth={2} size={24} />}
        label="Search"
      />
      <NavItem
        href="/notifications"
        count={store.me.notifications.unreadCount}
        icon={<BellIcon strokeWidth={2} size={24} />}
        iconFilled={<BellIconSolid strokeWidth={1.5} size={24} />}
        label="Notifications"
      />
      <NavItem
        href={`/profile/${store.me.handle}`}
        icon={<UserIcon strokeWidth={1.75} size={28} />}
        iconFilled={<UserIconSolid strokeWidth={1.75} size={28} />}
        label="Profile"
      />
      <NavItem
        href="/settings"
        icon={<CogIcon strokeWidth={1.75} size={28} />}
        iconFilled={<CogIconSolid strokeWidth={1.5} size={28} />}
        label="Settings"
      />
    </View>
  )
})

const styles = StyleSheet.create({
  leftNav: {
    position: 'absolute',
    top: 10,
    right: 'calc(50vw + 300px)',
    width: 220,
  },

  profileCard: {
    marginVertical: 10,
  },

  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 10,
  },
  navItemIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    marginRight: 10,
    marginTop: 2,
  },
  navItemCount: {
    position: 'absolute',
    top: 0,
    left: 15,
    backgroundColor: colors.red3,
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 4,
    borderRadius: 6,
  },

  newPostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 18,
    backgroundColor: colors.blue3,
  },
  newPostBtnIconWrapper: {
    marginRight: 8,
  },
  newPostBtnLabel: {
    color: colors.white,
  },
})
