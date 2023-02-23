import React from 'react'
import {observer} from 'mobx-react-lite'
import {Pressable, StyleSheet, TouchableOpacity, View} from 'react-native'
import {Text} from 'view/com/util/text/Text'
import {Link} from 'view/com/util/Link'
import {UserAvatar} from 'view/com/util/UserAvatar'
import {usePalette} from 'lib/hooks/usePalette'
import {useColorSchemeStyle} from 'lib/hooks/useColorSchemeStyle'
import {useStores} from 'state/index'
import {colors} from 'lib/styles'
import {
  ComposeIcon,
  HomeIcon,
  HomeIconSolid,
  BellIcon,
  BellIconSolid,
  MagnifyingGlassIcon,
  CogIcon,
} from 'lib/icons'

interface NavItemProps {
  count?: number
  href: string
  icon: JSX.Element
  iconFilled: JSX.Element
  isProfile?: boolean
}
export const NavItem = observer(
  ({count, href, icon, iconFilled}: NavItemProps) => {
    const store = useStores()
    const hoverBg = useColorSchemeStyle(
      styles.navItemHoverBgLight,
      styles.navItemHoverBgDark,
    )
    const isCurrent = store.nav.tab.current.url === href
    const onPress = () => store.nav.navigate(href)
    return (
      <Pressable
        style={state => [
          styles.navItem,
          // @ts-ignore Pressable state differs for RNW -prf
          (state.hovered || isCurrent) && hoverBg,
        ]}
        onPress={onPress}>
        <View style={[styles.navItemIconWrapper]}>
          {isCurrent ? iconFilled : icon}
          {typeof count === 'number' && count > 0 && (
            <Text type="button" style={styles.navItemCount}>
              {count}
            </Text>
          )}
        </View>
      </Pressable>
    )
  },
)

export const ProfileItem = observer(() => {
  const store = useStores()
  const hoverBg = useColorSchemeStyle(
    styles.navItemHoverBgLight,
    styles.navItemHoverBgDark,
  )
  const href = `/profile/${store.me.handle}`
  const isCurrent = store.nav.tab.current.url === href
  const onPress = () => store.nav.navigate(href)
  return (
    <Pressable
      style={state => [
        styles.navItem,
        // @ts-ignore Pressable state differs for RNW -prf
        (state.hovered || isCurrent) && hoverBg,
      ]}
      onPress={onPress}>
      <View style={[styles.navItemIconWrapper]}>
        <UserAvatar
          handle={store.me.handle}
          displayName={store.me.displayName}
          avatar={store.me.avatar}
          size={28}
        />
      </View>
    </Pressable>
  )
})

export const DesktopHeader = observer(function DesktopHeader({}: {
  canGoBack?: boolean
}) {
  const store = useStores()
  const pal = usePalette('default')
  const onPressCompose = () => store.shell.openComposer({})
  return (
    <View style={[styles.header, pal.borderDark, pal.view]}>
      <Text type="title-xl" style={[pal.text, styles.title]}>
        Bluesky
      </Text>
      <View style={styles.space30} />
      <NavItem
        href="/"
        icon={<HomeIcon size={24} />}
        iconFilled={<HomeIconSolid size={24} />}
      />
      <View style={styles.space15} />
      <NavItem
        href="/search"
        icon={<MagnifyingGlassIcon size={24} />}
        iconFilled={<MagnifyingGlassIcon strokeWidth={3} size={24} />}
      />
      <View style={styles.space15} />
      <NavItem
        href="/notifications"
        count={store.me.notifications.unreadCount}
        icon={<BellIcon size={24} />}
        iconFilled={<BellIconSolid size={24} />}
      />
      <View style={styles.spaceFlex} />
      <TouchableOpacity style={[styles.newPostBtn]} onPress={onPressCompose}>
        <View style={styles.newPostBtnIconWrapper}>
          <ComposeIcon
            size={16}
            strokeWidth={2}
            style={styles.newPostBtnLabel}
          />
        </View>
        <Text type="md" style={styles.newPostBtnLabel}>
          New Post
        </Text>
      </TouchableOpacity>
      <View style={styles.space20} />
      <Link href="/search" style={[pal.view, pal.borderDark, styles.search]}>
        <MagnifyingGlassIcon
          size={18}
          style={[pal.textLight, styles.searchIconWrapper]}
        />
        <Text type="md-thin" style={pal.textLight}>
          Search
        </Text>
      </Link>
      <View style={styles.space15} />
      <ProfileItem />
      <NavItem
        href="/settings"
        icon={<CogIcon strokeWidth={2} size={28} />}
        iconFilled={<CogIcon strokeWidth={2.5} size={28} />}
      />
    </View>
  )
})

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    // paddingTop: 18,
    // paddingBottom: 18,
    paddingLeft: 30,
    paddingRight: 40,
    borderBottomWidth: 1,
  },

  spaceFlex: {
    flex: 1,
  },
  space15: {
    width: 15,
  },
  space20: {
    width: 20,
  },
  space30: {
    width: 30,
  },

  title: {},

  navItem: {
    paddingTop: 14,
    paddingBottom: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  navItemHoverBgLight: {
    borderBottomWidth: 2,
    borderBottomColor: colors.blue3,
  },
  navItemHoverBgDark: {
    borderBottomWidth: 2,
    backgroundColor: colors.blue3,
  },
  navItemIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    marginBottom: 2,
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

  search: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 300,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  searchIconWrapper: {
    flexDirection: 'row',
    width: 30,
    justifyContent: 'center',
    marginRight: 2,
  },

  newPostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    paddingTop: 8,
    paddingBottom: 9,
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
