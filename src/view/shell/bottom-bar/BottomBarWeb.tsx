import React from 'react'
import {usePalette} from 'lib/hooks/usePalette'
import {useNavigationState} from '@react-navigation/native'
import Animated from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {getCurrentRoute, isTab} from 'lib/routes/helpers'
import {styles} from './BottomBarStyles'
import {clamp} from 'lib/numbers'
import {
  BellIcon,
  BellIconSolid,
  HomeIcon,
  HomeIconSolid,
  MagnifyingGlassIcon2,
  MagnifyingGlassIcon2Solid,
  HashtagIcon,
  UserIcon,
  UserIconSolid,
} from 'lib/icons'
import {Link} from 'view/com/util/Link'
import {useMinimalShellMode} from 'lib/hooks/useMinimalShellMode'
import {makeProfileLink} from 'lib/routes/links'
import {CommonNavigatorParams} from 'lib/routes/types'
import {useSession} from '#/state/session'

export function BottomBarWeb() {
  const {hasSession, currentAccount} = useSession()
  const pal = usePalette('default')
  const safeAreaInsets = useSafeAreaInsets()
  const {footerMinimalShellTransform} = useMinimalShellMode()

  return (
    <Animated.View
      style={[
        styles.bottomBar,
        pal.view,
        pal.border,
        {paddingBottom: clamp(safeAreaInsets.bottom, 15, 30)},
        footerMinimalShellTransform,
      ]}>
      <NavItem routeName="Home" href="/">
        {({isActive}) => {
          const Icon = isActive ? HomeIconSolid : HomeIcon
          return (
            <Icon
              strokeWidth={4}
              size={24}
              style={[styles.ctrlIcon, pal.text, styles.homeIcon]}
            />
          )
        }}
      </NavItem>
      <NavItem routeName="Search" href="/search">
        {({isActive}) => {
          const Icon = isActive
            ? MagnifyingGlassIcon2Solid
            : MagnifyingGlassIcon2
          return (
            <Icon
              size={25}
              style={[styles.ctrlIcon, pal.text, styles.searchIcon]}
              strokeWidth={1.8}
            />
          )
        }}
      </NavItem>

      {hasSession && (
        <>
          <NavItem routeName="Feeds" href="/feeds">
            {({isActive}) => {
              return (
                <HashtagIcon
                  size={22}
                  style={[styles.ctrlIcon, pal.text, styles.feedsIcon]}
                  strokeWidth={isActive ? 4 : 2.5}
                />
              )
            }}
          </NavItem>
          <NavItem routeName="Notifications" href="/notifications">
            {({isActive}) => {
              const Icon = isActive ? BellIconSolid : BellIcon
              return (
                <Icon
                  size={24}
                  strokeWidth={1.9}
                  style={[styles.ctrlIcon, pal.text, styles.bellIcon]}
                />
              )
            }}
          </NavItem>
          <NavItem
            routeName="Profile"
            href={
              currentAccount
                ? makeProfileLink({
                    did: currentAccount.did,
                    handle: currentAccount.handle,
                  })
                : '/'
            }>
            {({isActive}) => {
              const Icon = isActive ? UserIconSolid : UserIcon
              return (
                <Icon
                  size={28}
                  strokeWidth={1.5}
                  style={[styles.ctrlIcon, pal.text, styles.profileIcon]}
                />
              )
            }}
          </NavItem>
        </>
      )}
    </Animated.View>
  )
}

const NavItem: React.FC<{
  children: (props: {isActive: boolean}) => React.ReactChild
  href: string
  routeName: string
}> = ({children, href, routeName}) => {
  const {currentAccount} = useSession()
  const currentRoute = useNavigationState(state => {
    if (!state) {
      return {name: 'Home'}
    }
    return getCurrentRoute(state)
  })
  const isActive =
    currentRoute.name === 'Profile'
      ? isTab(currentRoute.name, routeName) &&
        (currentRoute.params as CommonNavigatorParams['Profile']).name ===
          currentAccount?.handle
      : isTab(currentRoute.name, routeName)

  return (
    <Link href={href} style={styles.ctrl} navigationAction="navigate">
      {children({isActive})}
    </Link>
  )
}
