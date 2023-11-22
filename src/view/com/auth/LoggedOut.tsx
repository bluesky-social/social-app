import React from 'react'
import {View, Pressable, StyleSheet} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

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
  const insets = useSafeAreaInsets()

  React.useEffect(() => {
    screen('Login')
    setMinimalShellMode(true)
  }, [screen, setMinimalShellMode])

  return (
    <View
      testID="noSessionView"
      style={[
        StyleSheet.absoluteFillObject,
        s.hContentRegion,
        pal.view,
        {
          paddingTop: insets.top + 60,
        },
      ]}>
      {onDismiss && (
        <Pressable
          accessibilityRole="button"
          style={[
            {
              position: 'absolute',
              top: insets.top + 10,
              right: 20,
              padding: 10,
              zIndex: 100,
              backgroundColor: pal.textLight.color,
              borderRadius: 100,
            },
          ]}
          onPress={onDismiss}>
          <FontAwesomeIcon
            icon="x"
            size={16}
            style={{
              color: String(pal.textInverted.color),
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
    </View>
  )
}
