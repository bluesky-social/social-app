import React from 'react'
import {View, Pressable} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {useLingui} from '@lingui/react'
import {msg} from '@lingui/macro'

import {isIOS} from 'platform/detection'
import {Login} from 'view/com/auth/login/Login'
import {CreateAccount} from 'view/com/auth/create/CreateAccount'
import {ErrorBoundary} from 'view/com/util/ErrorBoundary'
import {s} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {useAnalytics} from 'lib/analytics/analytics'
import {SplashScreen} from './SplashScreen'
import {useSetMinimalShellMode} from '#/state/shell/minimal-mode'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'

enum ScreenState {
  S_LoginOrCreateAccount,
  S_Login,
  S_CreateAccount,
}

export function LoggedOut({onDismiss}: {onDismiss?: () => void}) {
  const {_} = useLingui()
  const pal = usePalette('default')
  const setMinimalShellMode = useSetMinimalShellMode()
  const {screen} = useAnalytics()
  const [screenState, setScreenState] = React.useState<ScreenState>(
    ScreenState.S_LoginOrCreateAccount,
  )
  const {isMobile} = useWebMediaQueries()

  React.useEffect(() => {
    screen('Login')
    setMinimalShellMode(true)
  }, [screen, setMinimalShellMode])

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
        {onDismiss && (
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
            onPress={onDismiss}>
            <FontAwesomeIcon
              icon="x"
              size={12}
              style={{
                color: String(pal.textInverted.color),
              }}
            />
          </Pressable>
        )}

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
