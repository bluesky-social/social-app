import React from 'react'
import {View} from 'react-native'
import Animated from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigationState} from '@react-navigation/native'

import {useProfileQuery} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {useCloseAllActiveElements} from '#/state/util'
import {useMinimalShellMode} from 'lib/hooks/useMinimalShellMode'
import {usePalette} from 'lib/hooks/usePalette'
import {
  BellIcon,
  BellIconSolid,
  HashtagIcon,
  HomeIcon,
  HomeIconSolid,
  MagnifyingGlassIcon2,
  MagnifyingGlassIcon2Solid,
} from 'lib/icons'
import {clamp} from 'lib/numbers'
import {getCurrentRoute, isTab} from 'lib/routes/helpers'
import {makeProfileLink} from 'lib/routes/links'
import {CommonNavigatorParams} from 'lib/routes/types'
import {s} from 'lib/styles'
import {Button} from '#/view/com/util/forms/Button'
import {Text} from '#/view/com/util/text/Text'
import {Logo} from '#/view/icons/Logo'
import {Logotype} from '#/view/icons/Logotype'
import {Link} from 'view/com/util/Link'
import {LoadingPlaceholder} from 'view/com/util/LoadingPlaceholder'
import {UserAvatar} from 'view/com/util/UserAvatar'
import {styles} from './BottomBarStyles'

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
        styles.bottomBarWeb,
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
                <View style={[styles.ctrlIcon, pal.text, styles.homeIcon]}>
                  <Icon strokeWidth={4} size={24} />
                </View>
              )
            }}
          </NavItem>
          <NavItem routeName="Search" href="/search">
            {({isActive}) => {
              const Icon = isActive
                ? MagnifyingGlassIcon2Solid
                : MagnifyingGlassIcon2
              return (
                <View style={[styles.ctrlIcon, pal.text, styles.searchIcon]}>
                  <Icon size={25} strokeWidth={1.8} />
                </View>
              )
            }}
          </NavItem>

          <NavItem routeName="Feeds" href="/feeds">
            {({isActive}) => {
              return (
                <View style={[styles.ctrlIcon, pal.text, styles.feedsIcon]}>
                  <HashtagIcon size={22} strokeWidth={isActive ? 4 : 2.5} />
                </View>
              )
            }}
          </NavItem>
          <NavItem routeName="Notifications" href="/notifications">
            {({isActive}) => {
              const Icon = isActive ? BellIconSolid : BellIcon
              return (
                <View style={[styles.ctrlIcon, pal.text, styles.bellIcon]}>
                  <Icon size={24} strokeWidth={1.9} />
                </View>
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
            {({isActive}) => <ProfileIcon isActive={isActive} />}
          </NavItem>
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

function ProfileIcon({isActive}: {isActive: boolean}) {
  const pal = usePalette('default')
  return (
    <View style={styles.ctrlIconSizingWrapper}>
      {isActive ? (
        <View
          style={[
            styles.ctrlIcon,
            styles.profileIcon,
            {borderColor: pal.text.color},
          ]}>
          <ProfileIconInner size={28} />
        </View>
      ) : (
        <View style={[styles.ctrlIcon, styles.profileIcon]}>
          <ProfileIconInner size={28} />
        </View>
      )}
    </View>
  )
}

function ProfileIconInner({size}: {size: number}) {
  const {currentAccount} = useSession()
  const {isLoading, data: profile} = useProfileQuery({did: currentAccount!.did})

  return !isLoading && profile ? (
    <UserAvatar
      avatar={profile?.avatar}
      size={size}
      type={profile?.associated?.labeler ? 'labeler' : 'user'}
    />
  ) : (
    <LoadingPlaceholder
      width={size}
      height={size}
      style={{borderRadius: size}}
    />
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
