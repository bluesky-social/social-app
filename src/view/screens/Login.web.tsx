import React, {useState} from 'react'
import {
  Image,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import {observer} from 'mobx-react-lite'
import {CenteredView} from '../com/util/Views'
import {Signin} from '../com/login/Signin'
import {CreateAccount} from '../com/login/CreateAccount'
import {Text} from '../com/util/text/Text'
import {ErrorBoundary} from '../com/util/ErrorBoundary'
import {colors} from '../lib/styles'
import {usePalette} from '../lib/hooks/usePalette'
import {CLOUD_SPLASH} from '../lib/assets'

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
  const pal = usePalette('default')
  return (
    <>
      <View style={styles.hero}>
        <View style={styles.heroText}>
          <Text style={styles.title}>Bluesky</Text>
          <Text style={styles.subtitle}>[ private beta ]</Text>
        </View>
      </View>
      <View testID="signinOrCreateAccount" style={styles.btns}>
        <TouchableOpacity
          testID="createAccountButton"
          style={[pal.view, styles.btn]}
          onPress={onPressCreateAccount}>
          <Text style={[pal.link, styles.btnLabel]}>New account</Text>
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
  const [screenState, setScreenState] = useState<ScreenState>(
    ScreenState.S_SigninOrCreateAccount,
  )

  if (screenState === ScreenState.S_SigninOrCreateAccount) {
    return (
      <CenteredView style={[styles.container, styles.vertCenter]}>
        <ErrorBoundary>
          <SigninOrCreateAccount
            onPressSignin={() => setScreenState(ScreenState.S_Signin)}
            onPressCreateAccount={() =>
              setScreenState(ScreenState.S_CreateAccount)
            }
          />
        </ErrorBoundary>
      </CenteredView>
    )
  }

  return (
    <CenteredView
      style={[
        styles.container,
        styles.containerBorder,
        pal.view,
        pal.borderDark,
      ]}>
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
    </CenteredView>
  )
})

const styles = StyleSheet.create({
  container: {
    height: '100%',
  },
  containerBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  vertCenter: {
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
    flexDirection: 'row',
    paddingTop: 40,
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
    flex: 1,
    borderRadius: 4,
    paddingVertical: 16,
    marginBottom: 20,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: colors.blue3,
  },
  btnLabel: {
    textAlign: 'center',
    fontSize: 21,
    fontWeight: '500',
    color: colors.blue3,
  },
})
