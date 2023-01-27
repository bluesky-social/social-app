import React from 'react'
import {Pressable, StyleSheet, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {Link} from '../../com/util/Link'
import {Text} from '../../com/util/text/Text'
import {colors} from '../../lib/styles'
import {useStores} from '../../../state'
import {usePalette} from '../../lib/hooks/usePalette'
import {
  HomeIcon,
  HomeIconSolid,
  BellIcon,
  BellIconSolid,
  MagnifyingGlassIcon,
  CogIcon,
} from '../../lib/icons'

interface NavItemProps {
  label: string
  count?: number
  href: string
  icon: JSX.Element
  iconFilled: JSX.Element
}
export const NavItem = observer(
  ({label, count, href, icon, iconFilled}: NavItemProps) => {
    const store = useStores()
    const pal = usePalette('default')
    const isCurrent = store.nav.tab.current.url === href
    return (
      <Pressable
        style={state => [
          // @ts-ignore Pressable state differs for RNW -prf
          state.hovered && {backgroundColor: pal.colors.backgroundLight},
        ]}>
        <Link style={styles.navItem} href={href}>
          <View style={styles.navItemIconWrapper}>
            {isCurrent ? iconFilled : icon}
            {typeof count === 'number' && count > 0 && (
              <Text type="button" style={styles.navItemCount}>
                {count}
              </Text>
            )}
          </View>
          <Text type={isCurrent ? 'xl-bold' : 'xl-medium'}>{label}</Text>
        </Link>
      </Pressable>
    )
  },
)

export const DesktopLeftColumn = observer(() => {
  const store = useStores()
  const pal = usePalette('default')
  return (
    <View style={[styles.container, pal.border]}>
      <NavItem
        href="/"
        label="Home"
        icon={<HomeIcon />}
        iconFilled={<HomeIconSolid />}
      />
      <NavItem
        href="/search"
        label="Search"
        icon={<MagnifyingGlassIcon />}
        iconFilled={<MagnifyingGlassIcon strokeWidth={4} />}
      />
      <NavItem
        href="/notifications"
        label="Notifications"
        count={store.me.notificationCount}
        icon={<BellIcon />}
        iconFilled={<BellIconSolid />}
      />
      <NavItem
        href="/settings"
        label="Settings"
        icon={<CogIcon strokeWidth={1.5} />}
        iconFilled={<CogIcon strokeWidth={2} />}
      />
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 'calc(50vw - 500px)',
    width: '200px',
    height: '100%',
    borderRightWidth: 1,
  },
  navItem: {
    padding: '1rem',
    flexDirection: 'row',
    alignItems: 'center',
  },
  navItemIconWrapper: {
    flexDirection: 'row',
    width: 30,
    justifyContent: 'center',
    marginRight: 5,
  },
  navItemCount: {
    position: 'absolute',
    top: -5,
    left: 15,
    backgroundColor: colors.red3,
    color: colors.white,
    fontSize: 12,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
})
