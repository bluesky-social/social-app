import React from 'react'
import {SafeAreaView} from 'react-native'
import {observer} from 'mobx-react-lite'
import {Signin} from 'view/com/auth/Signin'
import {CreateAccount} from 'view/com/auth/CreateAccount'
import {ErrorBoundary} from 'view/com/util/ErrorBoundary'
import {s} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {useStores} from 'state/index'
import {useAnalytics} from 'lib/analytics'
import {SplashScreen} from './SplashScreen'
import {CenteredView} from '../util/Views'

enum ScreenState {
  S_SigninOrCreateAccount,
  S_Signin,
  S_CreateAccount,
}

export const LoggedOut = observer(() => {
  const pal = usePalette('default')
  const store = useStores()
  const {screen} = useAnalytics()
  const [screenState, setScreenState] = React.useState<ScreenState>(
    ScreenState.S_SigninOrCreateAccount,
  )

  React.useEffect(() => {
    screen('Login')
    store.shell.setMinimalShellMode(true)
  }, [store, screen])

  if (
    store.session.isResumingSession ||
    screenState === ScreenState.S_SigninOrCreateAccount
  ) {
    return (
      <SplashScreen
        onPressSignin={() => setScreenState(ScreenState.S_Signin)}
        onPressCreateAccount={() => setScreenState(ScreenState.S_CreateAccount)}
      />
    )
  }

  return (
    <CenteredView style={[s.hContentRegion, pal.view]}>
      <SafeAreaView testID="noSessionView" style={s.hContentRegion}>
        <ErrorBoundary>
          {screenState === ScreenState.S_Signin ? (
            <Signin
              onPressBack={() =>
                setScreenState(ScreenState.S_SigninOrCreateAccount)
              }
            />
          ) : undefined}
          {screenState === ScreenState.S_CreateAccount ? (
            <CreateAccount
              onPressBack={() =>
                setScreenState(ScreenState.S_SigninOrCreateAccount)
              }
            />
          ) : undefined}
        </ErrorBoundary>
      </SafeAreaView>
    </CenteredView>
  )
})
