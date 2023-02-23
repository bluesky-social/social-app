import React from 'react'
import {Pressable, StyleSheet, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {Link} from '../../com/util/Link'
import {Text} from '../../com/util/text/Text'
import {UserAvatar} from '../../com/util/UserAvatar'
import {colors} from 'lib/styles'
import {useStores} from 'state/index'
import {usePalette} from 'lib/hooks/usePalette'
import {useColorSchemeStyle} from 'lib/hooks/useColorSchemeStyle'
import {
  HomeIcon,
  HomeIconSolid,
  BellIcon,
  BellIconSolid,
  MagnifyingGlassIcon,
  CogIcon,
} from 'lib/icons'

interface NavItemProps {
  label: string
  count?: number
  href: string
  icon: JSX.Element
  iconFilled: JSX.Element
  isProfile?: boolean
}
export const NavItem = observer(
  ({label, count, href, icon, iconFilled, isProfile}: NavItemProps) => {
    const store = useStores()
    const hoverBg = useColorSchemeStyle(
      styles.navItemHoverBgLight,
      styles.navItemHoverBgDark,
    )
    const isCurrent = store.nav.tab.current.url === href
    return (
      <Pressable
        style={state => [
          // @ts-ignore Pressable state differs for RNW -prf
          state.hovered && hoverBg,
        ]}>
        <Link style={[styles.navItem]} href={href}>
          <View
            style={[
              styles.navItemIconWrapper,
              isProfile && styles.navItemProfile,
            ]}>
            {isCurrent ? iconFilled : icon}
            {typeof count === 'number' && count > 0 && (
              <Text type="button" style={styles.navItemCount}>
                {count}
              </Text>
            )}
          </View>
          <Text
            type={isCurrent || isProfile ? 'xl' : 'xl-thin'}
            numberOfLines={1}>
            {label}
          </Text>
        </Link>
      </Pressable>
    )
  },
)

export const DesktopLeftColumn = observer(() => {
  const store = useStores()
  const pal = usePalette('default')
  const avi = (
    <UserAvatar
      handle={store.me.handle}
      displayName={store.me.displayName}
      avatar={store.me.avatar}
      size={30}
    />
  )
  return (
    <View style={[styles.container]}>
      <View style={styles.main}>
        <NavItem
          href="/"
          label="Home"
          icon={<HomeIcon size={21} />}
          iconFilled={<HomeIconSolid size={21} />}
        />
        <NavItem
          href="/search"
          label="Explore"
          icon={<MagnifyingGlassIcon size={21} />}
          iconFilled={<MagnifyingGlassIcon strokeWidth={3} size={21} />}
        />
        <NavItem
          href="/notifications"
          label="Notifications"
          count={store.me.notifications.unreadCount}
          icon={<BellIcon size={21} />}
          iconFilled={<BellIconSolid size={21} />}
        />
        <NavItem
          href="/settings"
          label="Settings"
          icon={<CogIcon strokeWidth={2} size={21} />}
          iconFilled={<CogIcon strokeWidth={2.5} size={21} />}
        />
        <View style={[styles.separator, pal.borderDark]} />
        <NavItem
          isProfile
          href={`/profile/${store.me.handle}`}
          label={store.me.displayName || store.me.handle}
          icon={avi}
          iconFilled={avi}
        />
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 5,
    top: 100,
    width: '300px',
  },
  main: {
    flex: 1,
    paddingHorizontal: 16,
  },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  separator: {
    borderTopWidth: 1,
    marginVertical: 12,
    marginHorizontal: 8,
  },

  navItem: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    marginBottom: 2,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
  },
  navItemHoverBgLight: {
    backgroundColor: '#ebebf0',
    borderRadius: 6,
  },
  navItemHoverBgDark: {
    backgroundColor: colors.gray2, // TODO
    borderRadius: 6,
  },
  navItemIconWrapper: {
    flexDirection: 'row',
    width: 30,
    justifyContent: 'center',
    marginRight: 8,
  },
  navItemProfile: {
    width: 30,
    marginRight: 10,
  },
  navItemCount: {
    position: 'absolute',
    top: -5,
    left: 15,
    backgroundColor: colors.red3,
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 4,
    borderRadius: 6,
  },
})
