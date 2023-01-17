import React, {useState} from 'react'
import {
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native'
import Svg, {Line} from 'react-native-svg'
import {observer} from 'mobx-react-lite'
import {Signin} from '../com/login/Signin'
import {Logo} from '../com/login/Logo'
import {CreateAccount} from '../com/login/CreateAccount'
import {Text} from '../com/util/text/Text'
import {s, colors} from '../lib/styles'

enum ScreenState {
  SigninOrCreateAccount,
  Signin,
  CreateAccount,
}

const SigninOrCreateAccount = ({
  onPressSignin,
  onPressCreateAccount,
}: {
  onPressSignin: () => void
  onPressCreateAccount: () => void
}) => {
  const winDim = useWindowDimensions()
  const halfWidth = winDim.width / 2
  return (
    <>
      <View style={styles.hero}>
        <Logo />
        <Text style={styles.title}>Bluesky</Text>
        <Text style={styles.subtitle}>[ private beta ]</Text>
      </View>
      <View testID="signinOrCreateAccount" style={s.flex1}>
        <TouchableOpacity
          testID="createAccountButton"
          style={styles.btn}
          onPress={onPressCreateAccount}>
          <Text style={styles.btnLabel}>Create a new account</Text>
        </TouchableOpacity>
        <View style={styles.or}>
          <Svg height="1" width={winDim.width} style={styles.orLine}>
            <Line
              x1="30"
              y1="0"
              x2={halfWidth - 20}
              y2="0"
              stroke="white"
              strokeWidth="1"
            />
            <Line
              x1={halfWidth + 20}
              y1="0"
              x2={winDim.width - 30}
              y2="0"
              stroke="white"
              strokeWidth="1"
            />
          </Svg>
          <Text style={styles.orLabel}>or</Text>
        </View>
        <TouchableOpacity
          testID="signInButton"
          style={styles.btn}
          onPress={onPressSignin}>
          <Text style={styles.btnLabel}>Sign in</Text>
        </TouchableOpacity>
      </View>
    </>
  )
}

export const Login = observer(
  (/*{navigation}: RootTabsScreenProps<'Login'>*/) => {
    const [screenState, setScreenState] = useState<ScreenState>(
      ScreenState.SigninOrCreateAccount,
    )

    return (
      <View style={styles.outer}>
        {screenState === ScreenState.SigninOrCreateAccount ? (
          <SigninOrCreateAccount
            onPressSignin={() => setScreenState(ScreenState.Signin)}
            onPressCreateAccount={() =>
              setScreenState(ScreenState.CreateAccount)
            }
          />
        ) : undefined}
        {screenState === ScreenState.Signin ? (
          <Signin
            onPressBack={() =>
              setScreenState(ScreenState.SigninOrCreateAccount)
            }
          />
        ) : undefined}
        {screenState === ScreenState.CreateAccount ? (
          <CreateAccount
            onPressBack={() =>
              setScreenState(ScreenState.SigninOrCreateAccount)
            }
          />
        ) : undefined}
      </View>
    )
  },
)

const styles = StyleSheet.create({
  outer: {
    flex: 1,
  },
  hero: {
    flex: 2,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    color: colors.white,
    fontSize: 68,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    color: colors.white,
    fontSize: 18,
  },
  btn: {
    borderWidth: 1,
    borderColor: colors.white,
    borderRadius: 10,
    paddingVertical: 16,
    marginBottom: 20,
    marginHorizontal: 20,
    backgroundColor: colors.blue3,
  },
  btnLabel: {
    textAlign: 'center',
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  or: {
    marginBottom: 20,
  },
  orLine: {
    position: 'absolute',
    top: 10,
  },
  orLabel: {
    textAlign: 'center',
    color: colors.white,
    fontSize: 16,
  },
})
