import React from 'react'
import {View} from 'react-native'
import Animated from 'react-native-reanimated'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {useNavigationState} from '@react-navigation/native'

import {useMinimalShellFooterTransform} from '#/lib/hooks/useMinimalShellTransform'
import {getCurrentRoute, isTab} from '#/lib/routes/helpers'
import {makeProfileLink} from '#/lib/routes/links'
import {CommonNavigatorParams} from '#/lib/routes/types'
import {useGate} from '#/lib/statsig/statsig'
import {useHomeBadge} from '#/state/home-badge'
import {useUnreadMessageCount} from '#/state/queries/messages/list-conversations'
import {useUnreadNotifications} from '#/state/queries/notifications/unread'
import {useSession} from '#/state/session'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {useCloseAllActiveElements} from '#/state/util'
import {Button} from '#/view/com/util/forms/Button'
import {Link} from '#/view/com/util/Link'
import {Text} from '#/view/com/util/text/Text'
import {Logo} from '#/view/icons/Logo'
import {Logotype} from '#/view/icons/Logotype'
import {atoms as a, useTheme} from '#/alf'
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
import {styles} from './BottomBarStyles'

export function BottomBarWeb() {
  const {_} = useLingui()
  const {hasSession, currentAccount} = useSession()
  const t = useTheme()
  const footerMinimalShellTransform = useMinimalShellFooterTransform()
  const {requestSwitchToAccount} = useLoggedOutViewControls()
  const closeAllActiveElements = useCloseAllActiveElements()
  const iconWidth = 26

  const unreadMessageCount = useUnreadMessageCount()
  const notificationCountStr = useUnreadNotifications()
  const hasHomeBadge = useHomeBadge()
  const gate = useGate()

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
      role="navigation"
      style={[
        styles.bottomBar,
        styles.bottomBarWeb,
        t.atoms.bg,
        t.atoms.border_contrast_low,
        footerMinimalShellTransform,
      ]}>
      {hasSession ? (
        <>
          <NavItem
            routeName="Home"
            href="/"
            hasNew={hasHomeBadge && gate('remove_show_latest_button')}>
            {({isActive}) => {
              const Icon = isActive ? HomeFilled : Home
              return (
                <Icon
                  aria-hidden={true}
                  width={iconWidth + 1}
                  style={[styles.ctrlIcon, t.atoms.text, styles.homeIcon]}
                />
              )
            }}
          </NavItem>
          <NavItem routeName="Search" href="/search">
            {({isActive}) => {
              const Icon = isActive ? MagnifyingGlassFilled : MagnifyingGlass
              return (
                <Icon
                  aria-hidden={true}
                  width={iconWidth + 2}
                  style={[styles.ctrlIcon, t.atoms.text, styles.searchIcon]}
                />
              )
            }}
          </NavItem>

          {hasSession && (
            <>
              <NavItem
                routeName="Messages"
                href="/messages"
                notificationCount={
                  unreadMessageCount.count > 0
                    ? unreadMessageCount.numUnread
                    : undefined
                }>
                {({isActive}) => {
                  const Icon = isActive ? MessageFilled : Message
                  return (
                    <Icon
                      aria-hidden={true}
                      width={iconWidth - 1}
                      style={[
                        styles.ctrlIcon,
                        t.atoms.text,
                        styles.messagesIcon,
                      ]}
                    />
                  )
                }}
              </NavItem>
              <NavItem
                routeName="Notifications"
                href="/notifications"
                notificationCount={notificationCountStr}>
                {({isActive}) => {
                  const Icon = isActive ? BellFilled : Bell
                  return (
                    <Icon
                      aria-hidden={true}
                      width={iconWidth}
                      style={[styles.ctrlIcon, t.atoms.text, styles.bellIcon]}
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
                  const Icon = isActive ? UserCircleFilled : UserCircle
                  return (
                    <Icon
                      aria-hidden={true}
                      width={iconWidth}
                      style={[
                        styles.ctrlIcon,
                        t.atoms.text,
                        styles.profileIcon,
                      ]}
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
              paddingBottom: 14,
              paddingLeft: 14,
              paddingRight: 6,
              gap: 8,
            }}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
              <Logo width={32} />
              <View style={{paddingTop: 4}}>
                <Logotype width={80} fill={t.atoms.text.color} />
              </View>
            </View>

            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
              <Button
                onPress={showCreateAccount}
                accessibilityHint={_(msg`Sign up`)}
                accessibilityLabel={_(msg`Sign up`)}>
                <Text type="md" style={[{color: 'white'}, a.font_bold]}>
                  <Trans>Sign up</Trans>
                </Text>
              </Button>

              <Button
                type="default"
                onPress={showSignIn}
                accessibilityHint={_(msg`Sign in`)}
                accessibilityLabel={_(msg`Sign in`)}>
                <Text type="md" style={[t.atoms.text, a.font_bold]}>
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
  hasNew?: boolean
  notificationCount?: string
}> = ({children, href, routeName, hasNew, notificationCount}) => {
  const {_} = useLingui()
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
    <Link
      href={href}
      style={[styles.ctrl, a.pb_lg]}
      navigationAction="navigate"
      aria-role="link"
      aria-label={routeName}
      accessible={true}>
      {children({isActive})}
      {notificationCount ? (
        <View
          style={styles.notificationCount}
          aria-label={_(msg`${notificationCount} unread items`)}>
          <Text style={styles.notificationCountLabel}>{notificationCount}</Text>
        </View>
      ) : hasNew ? (
        <View style={styles.hasNewBadge} />
      ) : null}
    </Link>
  )
}
