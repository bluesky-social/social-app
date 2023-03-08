import React, {useEffect, useState} from 'react'
import {SafeAreaView, StyleSheet, TouchableOpacity, View} from 'react-native'
import Image, {Source as ImageSource} from 'view/com/util/images/Image'
import {observer} from 'mobx-react-lite'
import {Signin} from '../com/login/Signin'
import {CreateAccount} from '../com/login/CreateAccount'
import {Text} from '../com/util/text/Text'
import {ErrorBoundary} from '../com/util/ErrorBoundary'
import {colors} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {useStores} from 'state/index'
import {CLOUD_SPLASH} from 'lib/assets'
import {useAnalytics} from 'lib/analytics'

enum ScreenState {
  S_SigninOrCreateAccount,
  S_Signin,
  S_CreateAccount,
}

const SigninOrCreateAccount = ({
  onPressSignin,
  onPressCreateAccount,
}: {
  onPressSignin: () => void
  onPressCreateAccount: () => void
}) => {
  const {screen} = useAnalytics()

  useEffect(() => {
    screen('Login')
  }, [screen])

  const pal = usePalette('default')
  return (
    <>
      <View style={styles.hero}>
        <View style={styles.heroText}>
          <Text style={styles.title}>Bluesky</Text>
        </View>
      </View>
      <View testID="signinOrCreateAccount" style={styles.btns}>
        <TouchableOpacity
          testID="createAccountButton"
          style={[pal.view, styles.btn]}
          onPress={onPressCreateAccount}>
          <Text style={[pal.link, styles.btnLabel]}>Create a new account</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="signInButton"
          style={[pal.view, styles.btn]}
          onPress={onPressSignin}>
          <Text style={[pal.link, styles.btnLabel]}>Sign in</Text>
        </TouchableOpacity>
      </View>
    </>
  )
}

export const Login = observer(() => {
  const pal = usePalette('default')
  const store = useStores()
  const [screenState, setScreenState] = useState<ScreenState>(
    ScreenState.S_SigninOrCreateAccount,
  )

  if (
    store.session.isResumingSession ||
    screenState === ScreenState.S_SigninOrCreateAccount
  ) {
    return (
      <View style={styles.container}>
        <Image source={CLOUD_SPLASH as ImageSource} style={styles.bgImg} />
        <SafeAreaView testID="noSessionView" style={styles.container}>
          <ErrorBoundary>
            {!store.session.isResumingSession && (
              <SigninOrCreateAccount
                onPressSignin={() => setScreenState(ScreenState.S_Signin)}
                onPressCreateAccount={() =>
                  setScreenState(ScreenState.S_CreateAccount)
                }
              />
            )}
          </ErrorBoundary>
        </SafeAreaView>
      </View>
    )
  }

  return (
    <View style={[styles.container, pal.view]}>
      <SafeAreaView testID="noSessionView" style={styles.container}>
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
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    height: '100%',
  },
  outer: {
    flex: 1,
  },
  hero: {
    flex: 2,
    justifyContent: 'center',
  },
  bgImg: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  heroText: {
    backgroundColor: colors.white,
    paddingTop: 10,
    paddingBottom: 20,
  },
  btns: {
    paddingBottom: 40,
  },
  title: {
    textAlign: 'center',
    color: colors.blue3,
    fontSize: 68,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    color: colors.blue3,
    fontSize: 18,
  },
  btn: {
    borderRadius: 4,
    paddingVertical: 16,
    marginBottom: 20,
    marginHorizontal: 20,
    backgroundColor: colors.blue3,
  },
  btnLabel: {
    textAlign: 'center',
    fontSize: 21,
    // fontWeight: '500',
    color: colors.white,
  },
})
