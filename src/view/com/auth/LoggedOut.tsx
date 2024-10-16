import React from 'react'
import {Pressable, View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {logEvent} from '#/lib/statsig/statsig'
import {
  useLoggedOutView,
  useLoggedOutViewControls,
} from '#/state/shell/logged-out'
import {useSetMinimalShellMode} from '#/state/shell/minimal-mode'
import {ErrorBoundary} from '#/view/com/util/ErrorBoundary'
import {Login} from '#/screens/Login'
import {Signup} from '#/screens/Signup'
import {LandingScreen} from '#/screens/StarterPack/StarterPackLandingScreen'
import {atoms as a, useTheme} from '#/alf'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/Times'
import {SplashScreen} from './SplashScreen'

enum ScreenState {
  S_LoginOrCreateAccount,
  S_Login,
  S_CreateAccount,
  S_StarterPack,
}
export {ScreenState as LoggedOutScreenState}

export function LoggedOut({onDismiss}: {onDismiss?: () => void}) {
  const {_} = useLingui()
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const setMinimalShellMode = useSetMinimalShellMode()
  const {requestedAccountSwitchTo} = useLoggedOutView()
  const [screenState, setScreenState] = React.useState<ScreenState>(() => {
    if (requestedAccountSwitchTo === 'new') {
      return ScreenState.S_CreateAccount
    } else if (requestedAccountSwitchTo === 'starterpack') {
      return ScreenState.S_StarterPack
    } else if (requestedAccountSwitchTo != null) {
      return ScreenState.S_Login
    } else {
      return ScreenState.S_LoginOrCreateAccount
    }
  })
  const {clearRequestedAccount} = useLoggedOutViewControls()

  React.useEffect(() => {
    setMinimalShellMode(true)
  }, [setMinimalShellMode])

  const onPressDismiss = React.useCallback(() => {
    if (onDismiss) {
      onDismiss()
    }
    clearRequestedAccount()
  }, [clearRequestedAccount, onDismiss])

  return (
    <View
      testID="noSessionView"
      style={[
        a.util_screen_outer,
        t.atoms.bg,
        {paddingTop: insets.top, paddingBottom: insets.bottom},
      ]}>
      <ErrorBoundary>
        {onDismiss && screenState === ScreenState.S_LoginOrCreateAccount ? (
          <Pressable
            accessibilityHint={_(msg`Go back`)}
            accessibilityLabel={_(msg`Go back`)}
            accessibilityRole="button"
            style={[
              {
                top: insets.top + 12,
                right: 20,
                zIndex: 100,
                backgroundColor: t.atoms.text.color,
              },
              a.p_sm,
              a.absolute,
              a.rounded_full,
            ]}
            onPress={onPressDismiss}>
            <XIcon size="sm" style={[t.atoms.text_inverted]} />
          </Pressable>
        ) : null}

        {screenState === ScreenState.S_StarterPack ? (
          <LandingScreen setScreenState={setScreenState} />
        ) : screenState === ScreenState.S_LoginOrCreateAccount ? (
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
