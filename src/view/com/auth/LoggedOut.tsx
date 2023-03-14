import React from 'react'
import {SafeAreaView} from 'react-native'
import {observer} from 'mobx-react-lite'
import {Login} from 'view/com/auth/login/Login'
import {CreateAccount} from 'view/com/auth/create/CreateAccount'
import {ErrorBoundary} from 'view/com/util/ErrorBoundary'
import {s} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {useStores} from 'state/index'
import {useAnalytics} from 'lib/analytics'
import {SplashScreen} from './SplashScreen'
import {CenteredView} from '../util/Views'

enum ScreenState {
  S_LoginOrCreateAccount,
  S_Login,
  S_CreateAccount,
}

export const LoggedOut = observer(() => {
  const pal = usePalette('default')
  const store = useStores()
  const {screen} = useAnalytics()
  const [screenState, setScreenState] = React.useState<ScreenState>(
    ScreenState.S_LoginOrCreateAccount,
  )

  React.useEffect(() => {
    screen('Login')
    store.shell.setMinimalShellMode(true)
  }, [store, screen])

  if (
    store.session.isResumingSession ||
    screenState === ScreenState.S_LoginOrCreateAccount
  ) {
    return (
      <SplashScreen
        onPressSignin={() => setScreenState(ScreenState.S_Login)}
        onPressCreateAccount={() => setScreenState(ScreenState.S_CreateAccount)}
      />
    )
  }

  return (
    <CenteredView style={[s.hContentRegion, pal.view]}>
      <SafeAreaView testID="noSessionView" style={s.hContentRegion}>
        <ErrorBoundary>
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
    </CenteredView>
  )
})
