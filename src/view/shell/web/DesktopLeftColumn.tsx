import React from 'react'
import {Pressable, StyleSheet, TouchableOpacity, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import LinearGradient from 'react-native-linear-gradient'
import {Link} from '../../com/util/Link'
import {Text} from '../../com/util/text/Text'
import {UserAvatar} from '../../com/util/UserAvatar'
import {s, colors, gradients} from '../../lib/styles'
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
  isProfile?: boolean
}
export const NavItem = observer(
  ({label, count, href, icon, iconFilled, isProfile}: NavItemProps) => {
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
            type={isCurrent ? 'xl-bold' : 'xl'}
            style={styles.navItemLabel}
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
  const onPressCompose = () => store.shell.openComposer({})
  const avi = (
    <UserAvatar
      handle={store.me.handle}
      displayName={store.me.displayName}
      avatar={store.me.avatar}
      size={40}
    />
  )
  return (
    <View style={[styles.container, pal.border]}>
      <NavItem
        isProfile
        href={`/profile/${store.me.handle}`}
        label={store.me.displayName || store.me.handle}
        icon={avi}
        iconFilled={avi}
      />
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
      <TouchableOpacity onPress={onPressCompose}>
        <LinearGradient
          colors={[gradients.blueLight.start, gradients.blueLight.end]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.composeBtn}>
          <Text type="xl-medium" style={[s.white, s.textCenter]}>
            New Post
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 'calc(50vw - 530px)',
    width: '230px',
    height: '100%',
    borderRightWidth: 1,
    paddingTop: 5,
  },
  navItem: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  navItemIconWrapper: {
    flexDirection: 'row',
    width: 30,
    justifyContent: 'center',
    marginRight: 5,
  },
  navItemProfile: {
    width: 40,
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
  navItemLabel: {
    fontSize: 19,
  },
  composeBtn: {
    marginTop: 20,
    marginBottom: 10,
    marginLeft: 10,
    marginRight: 20,
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
})
