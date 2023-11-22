import React from 'react'
import {Pressable, SafeAreaView, StyleSheet} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'

import {Login} from 'view/com/auth/login/Login'
import {CreateAccount} from 'view/com/auth/create/CreateAccount'
import {ErrorBoundary} from 'view/com/util/ErrorBoundary'
import {s} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {useAnalytics} from 'lib/analytics/analytics'
import {SplashScreen} from './SplashScreen'
import {useSetMinimalShellMode} from '#/state/shell/minimal-mode'

enum ScreenState {
  S_LoginOrCreateAccount,
  S_Login,
  S_CreateAccount,
}

export function LoggedOut({onDismiss}: {onDismiss?: () => void}) {
  const pal = usePalette('default')
  const setMinimalShellMode = useSetMinimalShellMode()
  const {screen} = useAnalytics()
  const [screenState, setScreenState] = React.useState<ScreenState>(
    ScreenState.S_LoginOrCreateAccount,
  )

  React.useEffect(() => {
    screen('Login')
    setMinimalShellMode(true)
  }, [screen, setMinimalShellMode])

  return (
    <SafeAreaView
      testID="noSessionView"
      style={[StyleSheet.absoluteFillObject, s.hContentRegion, pal.view]}>
      {onDismiss && (
        <Pressable
          accessibilityRole="button"
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            padding: 20,
            zIndex: 100,
          }}
          onPress={onDismiss}>
          <FontAwesomeIcon
            icon="x"
            size={24}
            style={{
              color: String(pal.text.color),
            }}
          />
        </Pressable>
      )}

      <ErrorBoundary>
        {screenState === ScreenState.S_LoginOrCreateAccount ? (
          <SplashScreen
            onPressSignin={() => setScreenState(ScreenState.S_Login)}
            onPressCreateAccount={() =>
              setScreenState(ScreenState.S_CreateAccount)
            }
          />
        ) : undefined}
        {screenState === ScreenState.S_Login ? (
          <Login
            onPressBack={() =>
              setScreenState(ScreenState.S_LoginOrCreateAccount)
            }
          />
        ) : undefined}
        {screenState === ScreenState.S_CreateAccount ? (
          <CreateAccount
            onPressBack={() =>
              setScreenState(ScreenState.S_LoginOrCreateAccount)
            }
          />
        ) : undefined}
      </ErrorBoundary>
    </SafeAreaView>
  )
}
