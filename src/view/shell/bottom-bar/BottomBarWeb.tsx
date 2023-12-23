import React from 'react'
import {usePalette} from 'lib/hooks/usePalette'
import {useNavigationState} from '@react-navigation/native'
import Animated from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
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
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {useCloseAllActiveElements} from '#/state/util'
import {Button} from '#/view/com/util/forms/Button'
import {Text} from '#/view/com/util/text/Text'
import {s} from 'lib/styles'
import {Logo} from '#/view/icons/Logo'
import {Logotype} from '#/view/icons/Logotype'

export function BottomBarWeb() {
  const {_} = useLingui()
  const {hasSession, currentAccount} = useSession()
  const pal = usePalette('default')
  const safeAreaInsets = useSafeAreaInsets()
  const {footerMinimalShellTransform} = useMinimalShellMode()
  const {requestSwitchToAccount} = useLoggedOutViewControls()
  const closeAllActiveElements = useCloseAllActiveElements()

  const showSignIn = React.useCallback(() => {
    closeAllActiveElements()
    requestSwitchToAccount({requestedAccount: 'none'})
  }, [requestSwitchToAccount, closeAllActiveElements])

  const showCreateAccount = React.useCallback(() => {
    closeAllActiveElements()
    requestSwitchToAccount({requestedAccount: 'new'})
    // setShowLoggedOut(true)
  }, [requestSwitchToAccount, closeAllActiveElements])

  return (
    <Animated.View
      style={[
        styles.bottomBar,
        pal.view,
        pal.border,
        {paddingBottom: clamp(safeAreaInsets.bottom, 15, 30)},
        footerMinimalShellTransform,
      ]}>
      {hasSession ? (
        <>
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
        </>
      ) : (
        <>
          <View
            style={{
              width: '100%',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: 14,
              paddingBottom: 2,
              paddingLeft: 14,
              paddingRight: 6,
              gap: 8,
            }}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
              <Logo width={32} />
              <View style={{paddingTop: 4}}>
                <Logotype width={80} fill={pal.text.color} />
              </View>
            </View>

            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
              <Button
                onPress={showCreateAccount}
                accessibilityHint={_(msg`Sign up`)}
                accessibilityLabel={_(msg`Sign up`)}>
                <Text type="md" style={[{color: 'white'}, s.bold]}>
                  <Trans>Sign up</Trans>
                </Text>
              </Button>

              <Button
                type="default"
                onPress={showSignIn}
                accessibilityHint={_(msg`Sign in`)}
                accessibilityLabel={_(msg`Sign in`)}>
                <Text type="md" style={[pal.text, s.bold]}>
                  <Trans>Sign in</Trans>
                </Text>
              </Button>
            </View>
          </View>
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
