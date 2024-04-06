import React from 'react'
import {View} from 'react-native'
import Animated from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigationState} from '@react-navigation/native'

import {useSession} from '#/state/session'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {useCloseAllActiveElements} from '#/state/util'
import {useMinimalShellMode} from 'lib/hooks/useMinimalShellMode'
import {usePalette} from 'lib/hooks/usePalette'
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
import {atoms as a, useTheme} from '#/alf'
import {
  Bell2_Filled_Corner0_Rounded as BellFilled,
  Bell2_Stroke2_Corner0_Rounded as Bell,
} from '#/components/icons/Bell'
import {
  Hashtag_Filled_Corner0_Rounded as HashtagFilled,
  Hashtag_Stroke2_Corner0_Rounded as Hashtag,
} from '#/components/icons/Hashtag'
import {
  Home_Filled_Corner0_Rounded as HomeFilled,
  Home_Stroke2_Corner0_Rounded as Home,
} from '#/components/icons/Home'
import {MagnifyingGlass2_Stroke2_Corner0_Rounded as MagnifyingGlass} from '#/components/icons/MagnifyingGlass'
import {MagnifyingGlass_Filled_Corner0_Rounded as MagnifyingGlassFilled} from '#/components/icons/MagnifyingGlass2'
import {
  PersonCircle_Filled_Corner0_Rounded as PersonCircleFilled,
  PersonCircle_Stroke2_Corner0_Rounded as PersonCircle,
} from '#/components/icons/PersonCircle'

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

  const t = useTheme()

  return (
    <Animated.View
      style={[
        t.atoms.bg,
        t.atoms.border_contrast_low,
        a.flex_row,
        a.w_full,
        a.border_t,
        a.absolute,
        a.fixed,
        {bottom: 0, paddingBottom: clamp(safeAreaInsets.bottom, 15, 30)},
        footerMinimalShellTransform,
      ]}>
      {hasSession ? (
        <>
          <NavItem routeName="Home" href="/">
            {({isActive}) => {
              const Icon = isActive ? HomeFilled : Home
              return <Icon style={t.atoms.text} size="xl" />
            }}
          </NavItem>
          <NavItem routeName="Search" href="/search">
            {({isActive}) => {
              const Icon = isActive ? MagnifyingGlassFilled : MagnifyingGlass
              return <Icon style={t.atoms.text} size="xl" />
            }}
          </NavItem>

          {hasSession && (
            <>
              <NavItem routeName="Feeds" href="/feeds">
                {({isActive}) => {
                  const Icon = isActive ? Hashtag : HashtagFilled
                  return <Icon style={t.atoms.text} size="xl" />
                }}
              </NavItem>
              <NavItem routeName="Notifications" href="/notifications">
                {({isActive}) => {
                  const Icon = isActive ? BellFilled : Bell
                  return <Icon style={t.atoms.text} size="xl" />
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
                  const Icon = isActive ? PersonCircleFilled : PersonCircle
                  return <Icon style={t.atoms.text} size="xl" />
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
    <Link
      href={href}
      style={[a.flex_1, a.align_center, a.pt_md, a.pb_xs]}
      navigationAction="navigate">
      {children({isActive})}
    </Link>
  )
}
