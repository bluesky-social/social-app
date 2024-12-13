import React from 'react'
import {View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {PressableScale} from '#/lib/custom-animations/PressableScale'
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
import {atoms as a, native, tokens, useTheme} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
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
          <Button
            label={_(msg`Go back`)}
            variant="solid"
            color="secondary_inverted"
            size="small"
            shape="round"
            PressableComponent={native(PressableScale)}
            style={[
              a.absolute,
              {
                top: insets.top + tokens.space.xl,
                right: tokens.space.xl,
                zIndex: 100,
              },
            ]}
            onPress={onPressDismiss}>
            <ButtonIcon icon={XIcon} />
          </Button>
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
