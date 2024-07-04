import React from 'react'
import {View} from 'react-native'
import Animated from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigationState} from '@react-navigation/native'

import {useMinimalShellFooterTransform} from '#/lib/hooks/useMinimalShellTransform'
import {usePalette} from '#/lib/hooks/usePalette'
import {clamp} from '#/lib/numbers'
import {getCurrentRoute, isTab} from '#/lib/routes/helpers'
import {makeProfileLink} from '#/lib/routes/links'
import {CommonNavigatorParams} from '#/lib/routes/types'
import {s} from '#/lib/styles'
import {useSession} from '#/state/session'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {useCloseAllActiveElements} from '#/state/util'
import {useUnreadMessageCount} from 'state/queries/messages/list-converations'
import {useUnreadNotifications} from 'state/queries/notifications/unread'
import {Button} from '#/view/com/util/forms/Button'
import {Text} from '#/view/com/util/text/Text'
import {Logo} from '#/view/icons/Logo'
import {Logotype} from '#/view/icons/Logotype'
import {Link} from 'view/com/util/Link'
import {
  Bell_Filled_Corner0_Rounded as BellFilled,
  Bell_Stroke2_Corner0_Rounded as Bell,
} from '#/components/icons/Bell'
import {
  HomeOpen_Filled_Corner0_Rounded as HomeFilled,
  HomeOpen_Stoke2_Corner0_Rounded as Home,
} from '#/components/icons/HomeOpen'
import {MagnifyingGlass_Filled_Stroke2_Corner0_Rounded as MagnifyingGlassFilled} from '#/components/icons/MagnifyingGlass'
import {MagnifyingGlass2_Stroke2_Corner0_Rounded as MagnifyingGlass} from '#/components/icons/MagnifyingGlass2'
import {
  Message_Stroke2_Corner0_Rounded as Message,
  Message_Stroke2_Corner0_Rounded_Filled as MessageFilled,
} from '#/components/icons/Message'
import {
  UserCircle_Filled_Corner0_Rounded as UserCircleFilled,
  UserCircle_Stroke2_Corner0_Rounded as UserCircle,
} from '#/components/icons/UserCircle'
import {HomeTourExploreWrapper} from '#/tours/HomeTour'
import {styles} from './BottomBarStyles'

export function BottomBarWeb() {
  const {_} = useLingui()
  const {hasSession, currentAccount} = useSession()
  const pal = usePalette('default')
  const safeAreaInsets = useSafeAreaInsets()
  const footerMinimalShellTransform = useMinimalShellFooterTransform()
  const {requestSwitchToAccount} = useLoggedOutViewControls()
  const closeAllActiveElements = useCloseAllActiveElements()
  const iconWidth = 26

  const unreadMessageCount = useUnreadMessageCount()
  const notificationCountStr = useUnreadNotifications()

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
              const Icon = isActive ? HomeFilled : Home
              return (
                <Icon
                  width={iconWidth + 1}
                  style={[styles.ctrlIcon, pal.text, styles.homeIcon]}
                />
              )
            }}
          </NavItem>
          <NavItem routeName="Search" href="/search">
            {({isActive}) => {
              const Icon = isActive ? MagnifyingGlassFilled : MagnifyingGlass
              return (
                <HomeTourExploreWrapper>
                  <Icon
                    width={iconWidth + 2}
                    style={[styles.ctrlIcon, pal.text, styles.searchIcon]}
                  />
                </HomeTourExploreWrapper>
              )
            }}
          </NavItem>

          {hasSession && (
            <>
              <NavItem routeName="Messages" href="/messages">
                {({isActive}) => {
                  const Icon = isActive ? MessageFilled : Message
                  return (
                    <>
                      <Icon
                        width={iconWidth - 1}
                        style={[styles.ctrlIcon, pal.text, styles.messagesIcon]}
                      />
                      {unreadMessageCount.count > 0 && (
                        <View style={styles.notificationCount}>
                          <Text style={styles.notificationCountLabel}>
                            {unreadMessageCount.numUnread}
                          </Text>
                        </View>
                      )}
                    </>
                  )
                }}
              </NavItem>
              <NavItem routeName="Notifications" href="/notifications">
                {({isActive}) => {
                  const Icon = isActive ? BellFilled : Bell
                  return (
                    <>
                      <Icon
                        width={iconWidth}
                        style={[styles.ctrlIcon, pal.text, styles.bellIcon]}
                      />
                      {notificationCountStr !== '' && (
                        <View style={styles.notificationCount}>
                          <Text style={styles.notificationCountLabel}>
                            {notificationCountStr}
                          </Text>
                        </View>
                      )}
                    </>
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
                  const Icon = isActive ? UserCircleFilled : UserCircle
                  return (
                    <Icon
                      width={iconWidth}
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
