import React from 'react'
import {Pressable, View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {useAnalytics} from '#/lib/analytics/analytics'
import {usePalette} from '#/lib/hooks/usePalette'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {logEvent} from '#/lib/statsig/statsig'
import {s} from '#/lib/styles'
import {isIOS, isNative} from '#/platform/detection'
import {useSession} from '#/state/session'
import {
  useLoggedOutView,
  useLoggedOutViewControls,
} from '#/state/shell/logged-out'
import {useSetMinimalShellMode} from '#/state/shell/minimal-mode'
import {NavigationProp} from 'lib/routes/types'
import {ErrorBoundary} from '#/view/com/util/ErrorBoundary'
import {Text} from '#/view/com/util/text/Text'
import {Login} from '#/screens/Login'
import {Signup} from '#/screens/Signup'
import {SplashScreen} from './SplashScreen'

enum ScreenState {
  S_LoginOrCreateAccount,
  S_Login,
  S_CreateAccount,
}

export function LoggedOut({onDismiss}: {onDismiss?: () => void}) {
  const {hasSession} = useSession()
  const {_} = useLingui()
  const pal = usePalette('default')
  const setMinimalShellMode = useSetMinimalShellMode()
  const {screen} = useAnalytics()
  const {requestedAccountSwitchTo} = useLoggedOutView()
  const [screenState, setScreenState] = React.useState<ScreenState>(
    requestedAccountSwitchTo
      ? requestedAccountSwitchTo === 'new'
        ? ScreenState.S_CreateAccount
        : ScreenState.S_Login
      : ScreenState.S_LoginOrCreateAccount,
  )
  const {isMobile} = useWebMediaQueries()
  const {clearRequestedAccount} = useLoggedOutViewControls()
  const navigation = useNavigation<NavigationProp>()
  const isFirstScreen = screenState === ScreenState.S_LoginOrCreateAccount

  React.useEffect(() => {
    screen('Login')
    setMinimalShellMode(true)
  }, [screen, setMinimalShellMode])

  const onPressDismiss = React.useCallback(() => {
    if (onDismiss) {
      onDismiss()
    }
    clearRequestedAccount()
  }, [clearRequestedAccount, onDismiss])

  const onPressSearch = React.useCallback(() => {
    navigation.navigate(`SearchTab`)
  }, [navigation])

  return (
    <View
      testID="noSessionView"
      style={[
        s.hContentRegion,
        pal.view,
        {
          // only needed if dismiss button is present
          paddingTop: onDismiss && isMobile ? 40 : 0,
        },
      ]}>
      <ErrorBoundary>
        {onDismiss ? (
          <Pressable
            accessibilityHint={_(msg`Go back`)}
            accessibilityLabel={_(msg`Go back`)}
            accessibilityRole="button"
            style={{
              position: 'absolute',
              top: isIOS ? 0 : 20,
              right: 20,
              padding: 10,
              zIndex: 100,
              backgroundColor: pal.text.color,
              borderRadius: 100,
            }}
            onPress={onPressDismiss}>
            <FontAwesomeIcon
              icon="x"
              size={12}
              style={{
                color: String(pal.textInverted.color),
              }}
            />
          </Pressable>
        ) : isNative && !hasSession && isFirstScreen ? (
          <Pressable
            accessibilityHint={_(msg`Search for users`)}
            accessibilityLabel={_(msg`Search for users`)}
            accessibilityRole="button"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              position: 'absolute',
              top: 20,
              right: 20,
              paddingHorizontal: 16,
              paddingVertical: 8,
              zIndex: 100,
              backgroundColor: pal.btn.backgroundColor,
              borderRadius: 100,
            }}
            onPress={onPressSearch}>
            <Text type="lg-bold" style={[pal.text]}>
              <Trans>Search</Trans>{' '}
            </Text>
            <FontAwesomeIcon
              icon="search"
              size={16}
              style={{
                color: String(pal.text.color),
              }}
            />
          </Pressable>
        ) : null}

        {screenState === ScreenState.S_LoginOrCreateAccount ? (
          <SplashScreen
            onPressSignin={() => {
              setScreenState(ScreenState.S_Login)
              logEvent('splash:signInPressed', {})
            }}
            onPressCreateAccount={() => {
              setScreenState(ScreenState.S_CreateAccount)
              logEvent('splash:createAccountPressed', {})
            }}
          />
        ) : undefined}
        {screenState === ScreenState.S_Login ? (
          <Login
            onPressBack={() => {
              setScreenState(ScreenState.S_LoginOrCreateAccount)
              clearRequestedAccount()
            }}
          />
        ) : undefined}
        {screenState === ScreenState.S_CreateAccount ? (
          <Signup
            onPressBack={() =>
              setScreenState(ScreenState.S_LoginOrCreateAccount)
            }
          />
        ) : undefined}
      </ErrorBoundary>
    </View>
  )
}
