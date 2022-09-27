import React, {useState} from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native'
import Svg, {Line} from 'react-native-svg'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {observer} from 'mobx-react-lite'
import {s, colors} from '../lib/styles'
import {useStores} from '../../state'

enum ScreenState {
  SigninOrCreateAccount,
  Signin,
}

const SigninOrCreateAccount = ({
  onPressSignin,
}: {
  onPressSignin: () => void
}) => {
  const winDim = useWindowDimensions()
  const halfWidth = winDim.width / 2
  return (
    <>
      <View style={styles.hero}>
        <Text style={styles.title}>Bluesky</Text>
        <Text style={styles.subtitle}>[ private beta ]</Text>
      </View>
      <View style={s.flex1}>
        <TouchableOpacity style={styles.btn}>
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
        <TouchableOpacity style={styles.btn} onPress={onPressSignin}>
          <Text style={styles.btnLabel}>Sign in</Text>
        </TouchableOpacity>
      </View>
    </>
  )
}

const Signin = ({onPressBack}: {onPressBack: () => void}) => {
  const store = useStores()
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [username, setUsername] = useState<string>('')
  const [password, setPassword] = useState<string>('')

  const onPressNext = async () => {
    setError('')
    setIsProcessing(true)
    try {
      await store.session.login({
        service: 'http://localhost:2583/',
        username,
        password,
      })
    } catch (e: any) {
      const errMsg = e.toString()
      console.log(e)
      if (errMsg.includes('Authentication Required')) {
        setError('Invalid username or password')
      } else if (errMsg.includes('Network request failed')) {
        setError(
          'Unable to contact your service. Please check your Internet connection.',
        )
      } else {
        setError(errMsg.replace(/^Error:/, ''))
      }
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <KeyboardAvoidingView behavior="padding" style={{flex: 1}}>
      <View style={styles.hero}>
        <Text style={styles.title}>Bluesky</Text>
        <Text style={styles.subtitle}>[ private beta ]</Text>
      </View>
      <View style={s.flex1}>
        <View style={styles.group}>
          <View style={styles.groupTitle}>
            <Text style={[s.white, s.f18]}>Sign in</Text>
          </View>
          <View style={styles.groupContent}>
            <View style={[s.mb5]}>
              <TextInput
                style={styles.textInput}
                placeholder="Email or username"
                autoCapitalize="none"
                autoFocus
                value={username}
                onChangeText={setUsername}
                editable={!isProcessing}
              />
            </View>
            <View style={[s.mb5]}>
              <TextInput
                style={styles.textInput}
                placeholder="Password"
                autoCapitalize="none"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                editable={!isProcessing}
              />
            </View>
            {error ? (
              <View style={styles.error}>
                <View style={styles.errorIcon}>
                  <FontAwesomeIcon
                    icon="exclamation"
                    style={s.white}
                    size={10}
                  />
                </View>
                <View style={s.flex1}>
                  <Text style={[s.white, s.bold]}>{error}</Text>
                </View>
              </View>
            ) : undefined}
          </View>
        </View>
        <View style={[s.flexRow, s.pl20, s.pr20]}>
          <TouchableOpacity onPress={onPressBack}>
            <Text style={[s.white, s.f18, s.bold, s.pl5]}>Back</Text>
          </TouchableOpacity>
          <View style={s.flex1} />
          <TouchableOpacity onPress={onPressNext}>
            {isProcessing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[s.white, s.f18, s.bold, s.pr5]}>Next</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

export const Login = observer(
  (/*{navigation}: RootTabsScreenProps<'Login'>*/) => {
    // const store = useStores()
    const [screenState, setScreenState] = useState<ScreenState>(
      ScreenState.SigninOrCreateAccount,
    )
    const onPressSignin = () => {
      setScreenState(ScreenState.Signin)
    }

    return (
      <View style={styles.outer}>
        {screenState === ScreenState.SigninOrCreateAccount ? (
          <SigninOrCreateAccount onPressSignin={onPressSignin} />
        ) : undefined}
        {screenState === ScreenState.Signin ? (
          <Signin
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
    flex: 1,
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
  group: {
    borderWidth: 1,
    borderColor: colors.white,
    borderRadius: 10,
    marginBottom: 20,
    marginHorizontal: 20,
  },
  groupTitle: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.blue1,
  },
  groupContent: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  textInput: {
    width: '100%',
    backgroundColor: colors.white,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 4,
    fontSize: 18,
  },
  error: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    backgroundColor: colors.purple3,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 4,
  },
  errorIcon: {
    borderWidth: 1,
    borderColor: colors.white,
    color: colors.white,
    borderRadius: 30,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 5,
  },
})
