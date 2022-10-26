import React, {useState, useEffect} from 'react'
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
import Svg, {Circle, Line, Text as SvgText} from 'react-native-svg'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import * as EmailValidator from 'email-validator'
import {observer} from 'mobx-react-lite'
import {Picker} from '../com/util/Picker'
import {s, colors} from '../lib/styles'
import {useStores} from '../../state'
import {ServiceDescription} from '../../state/models/session'

enum ScreenState {
  SigninOrCreateAccount,
  Signin,
  CreateAccount,
}

const Logo = () => {
  return (
    <View style={styles.logo}>
      <Svg width="100" height="100">
        <Circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          stroke="white"
          strokeWidth={2}
        />
        <Line stroke="white" strokeWidth={1} x1="30" x2="30" y1="0" y2="100" />
        <Line stroke="white" strokeWidth={1} x1="74" x2="74" y1="0" y2="100" />
        <Line stroke="white" strokeWidth={1} x1="0" x2="100" y1="22" y2="22" />
        <Line stroke="white" strokeWidth={1} x1="0" x2="100" y1="74" y2="74" />
        <SvgText
          fill="none"
          stroke="white"
          strokeWidth={2}
          fontSize="60"
          fontWeight="bold"
          x="52"
          y="70"
          textAnchor="middle">
          B
        </SvgText>
      </Svg>
    </View>
  )
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
      <View style={s.flex1}>
        <TouchableOpacity style={styles.btn} onPress={onPressCreateAccount}>
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
      setIsProcessing(false)
      if (errMsg.includes('Authentication Required')) {
        setError('Invalid username or password')
      } else if (errMsg.includes('Network request failed')) {
        setError(
          'Unable to contact your service. Please check your Internet connection.',
        )
      } else {
        setError(errMsg.replace(/^Error:/, ''))
      }
    }
  }

  return (
    <KeyboardAvoidingView behavior="padding" style={{flex: 1}}>
      <View style={styles.logoHero}>
        <Logo />
      </View>
      <View style={styles.group}>
        <View style={styles.groupTitle}>
          <Text style={[s.white, s.f18, s.bold]}>Sign in</Text>
        </View>
        {error ? (
          <View style={styles.error}>
            <View style={styles.errorIcon}>
              <FontAwesomeIcon icon="exclamation" style={s.white} size={10} />
            </View>
            <View style={s.flex1}>
              <Text style={[s.white, s.bold]}>{error}</Text>
            </View>
          </View>
        ) : undefined}
        <View style={styles.groupContent}>
          <FontAwesomeIcon icon="envelope" style={styles.groupContentIcon} />
          <TextInput
            style={styles.textInput}
            placeholder="Email or username"
            placeholderTextColor={colors.blue0}
            autoCapitalize="none"
            autoFocus
            value={username}
            onChangeText={setUsername}
            editable={!isProcessing}
          />
        </View>
        <View style={styles.groupContent}>
          <FontAwesomeIcon icon="lock" style={styles.groupContentIcon} />
          <TextInput
            style={styles.textInput}
            placeholder="Password"
            placeholderTextColor={colors.blue0}
            autoCapitalize="none"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!isProcessing}
          />
        </View>
      </View>
      <View style={[s.flexRow, s.pl20, s.pr20]}>
        <TouchableOpacity onPress={onPressBack}>
          <Text style={[s.white, s.f18, s.pl5]}>Back</Text>
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
    </KeyboardAvoidingView>
  )
}

const CreateAccount = ({onPressBack}: {onPressBack: () => void}) => {
  const store = useStores()
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [serviceDescription, setServiceDescription] = useState<
    ServiceDescription | undefined
  >(undefined)
  const [userDomain, setUserDomain] = useState<string>('')
  const [inviteCode, setInviteCode] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [username, setUsername] = useState<string>('')

  useEffect(() => {
    let aborted = false
    if (serviceDescription || error) {
      return
    }
    store.session.describeService('http://localhost:2583/').then(
      desc => {
        if (aborted) return
        setServiceDescription(desc)
        setUserDomain(desc.availableUserDomains[0])
      },
      err => {
        if (aborted) return
        console.error(err)
        setError(
          'Unable to contact your service. Please check your Internet connection.',
        )
      },
    )
    return () => {
      aborted = true
    }
  }, [])

  const onPressNext = async () => {
    if (!email) {
      return setError('Please enter your email.')
    }
    if (!EmailValidator.validate(email)) {
      return setError('Your email appears to be invalid.')
    }
    if (!password) {
      return setError('Please choose your password.')
    }
    if (!username) {
      return setError('Please choose your username.')
    }
    setError('')
    setIsProcessing(true)
    try {
      await store.session.createAccount({
        service: 'http://localhost:2583/',
        email,
        username: `${username}.${userDomain}`,
        password,
        inviteCode,
      })
    } catch (e: any) {
      const errMsg = e.toString()
      console.log(e)
      setIsProcessing(false)
      // if (errMsg.includes('Authentication Required')) {
      //   setError('Invalid username or password')
      // } else if (errMsg.includes('Network request failed')) {
      //   setError(
      //     'Unable to contact your service. Please check your Internet connection.',
      //   )
      // } else {
      setError(errMsg.replace(/^Error:/, ''))
      // }
    }
  }

  const InitialLoadView = () => (
    <>
      {error ? (
        <>
          <View style={[styles.error, styles.errorFloating]}>
            <View style={styles.errorIcon}>
              <FontAwesomeIcon icon="exclamation" style={s.white} size={10} />
            </View>
            <View style={s.flex1}>
              <Text style={[s.white, s.bold]}>{error}</Text>
            </View>
          </View>
          <View style={[s.flexRow, s.pl20, s.pr20]}>
            <TouchableOpacity onPress={onPressBack}>
              <Text style={[s.white, s.f18, s.pl5]}>Back</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <ActivityIndicator color="#fff" />
      )}
    </>
  )

  return (
    <KeyboardAvoidingView behavior="padding" style={{flex: 1}}>
      <View style={styles.logoHero}>
        <Logo />
      </View>
      {serviceDescription ? (
        <>
          {error ? (
            <View style={[styles.error, styles.errorFloating]}>
              <View style={styles.errorIcon}>
                <FontAwesomeIcon icon="exclamation" style={s.white} size={10} />
              </View>
              <View style={s.flex1}>
                <Text style={[s.white, s.bold]}>{error}</Text>
              </View>
            </View>
          ) : undefined}
          <View style={styles.group}>
            <View style={styles.groupTitle}>
              <Text style={[s.white, s.f18, s.bold]}>Create a new account</Text>
            </View>
            {serviceDescription?.inviteCodeRequired ? (
              <View style={styles.groupContent}>
                <FontAwesomeIcon
                  icon="ticket"
                  style={styles.groupContentIcon}
                />
                <TextInput
                  style={[styles.textInput]}
                  placeholder="Invite code"
                  placeholderTextColor={colors.blue0}
                  autoCapitalize="none"
                  autoFocus
                  value={inviteCode}
                  onChangeText={setInviteCode}
                  editable={!isProcessing}
                />
              </View>
            ) : undefined}
            <View style={styles.groupContent}>
              <FontAwesomeIcon
                icon="envelope"
                style={styles.groupContentIcon}
              />
              <TextInput
                style={[styles.textInput]}
                placeholder="Email address"
                placeholderTextColor={colors.blue0}
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                editable={!isProcessing}
              />
            </View>
            <View style={styles.groupContent}>
              <FontAwesomeIcon icon="lock" style={styles.groupContentIcon} />
              <TextInput
                style={[styles.textInput]}
                placeholder="Choose your password"
                placeholderTextColor={colors.blue0}
                autoCapitalize="none"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                editable={!isProcessing}
              />
            </View>
          </View>
          <View style={styles.group}>
            <View style={styles.groupTitle}>
              <Text style={[s.white, s.f18, s.bold]}>Choose your username</Text>
            </View>
            <View style={styles.groupContent}>
              <FontAwesomeIcon icon="at" style={styles.groupContentIcon} />
              <TextInput
                style={[styles.textInput]}
                placeholder="eg alice"
                placeholderTextColor={colors.blue0}
                autoCapitalize="none"
                value={username}
                onChangeText={v => setUsername(cleanUsername(v))}
                editable={!isProcessing}
              />
            </View>
            {serviceDescription.availableUserDomains.length > 1 && (
              <View style={styles.groupContent}>
                <FontAwesomeIcon icon="globe" style={styles.groupContentIcon} />
                <Picker
                  style={styles.picker}
                  labelStyle={styles.pickerLabel}
                  iconStyle={styles.pickerIcon}
                  value={userDomain}
                  items={serviceDescription.availableUserDomains.map(d => ({
                    label: `.${d}`,
                    value: d,
                  }))}
                  onChange={itemValue => setUserDomain(itemValue)}
                  enabled={!isProcessing}
                />
              </View>
            )}
            <View style={styles.groupContent}>
              <Text style={[s.white, s.p10]}>
                Your full username will be{' '}
                <Text style={s.bold}>
                  @{username}.{userDomain}
                </Text>
              </Text>
            </View>
          </View>
          <View style={[s.flexRow, s.pl20, s.pr20]}>
            <TouchableOpacity onPress={onPressBack}>
              <Text style={[s.white, s.f18, s.pl5]}>Back</Text>
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
        </>
      ) : (
        <InitialLoadView />
      )}
    </KeyboardAvoidingView>
  )
}

function cleanUsername(v: string): string {
  v = v.trim()
  if (v.length > 63) {
    v = v.slice(0, 63)
  }
  return v.toLowerCase().replace(/[^a-z0-9-]/g, '')
}

export const Login = observer(
  (/*{navigation}: RootTabsScreenProps<'Login'>*/) => {
    // const store = useStores()
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
  logoHero: {
    paddingTop: 30,
    paddingBottom: 40,
  },
  logo: {
    flexDirection: 'row',
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
  group: {
    borderWidth: 1,
    borderColor: colors.white,
    borderRadius: 10,
    marginBottom: 20,
    marginHorizontal: 20,
    backgroundColor: colors.blue3,
  },
  groupTitle: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  groupContent: {
    borderTopWidth: 1,
    borderTopColor: colors.blue1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupContentIcon: {
    color: 'white',
    marginLeft: 10,
  },
  textInput: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.blue3,
    color: colors.white,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 18,
    borderRadius: 10,
  },
  picker: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.blue3,
    color: colors.white,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 18,
    borderRadius: 10,
  },
  pickerLabel: {
    color: colors.white,
    fontSize: 18,
  },
  pickerIcon: {
    color: colors.white,
  },
  error: {
    borderTopWidth: 1,
    borderTopColor: colors.blue1,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    backgroundColor: colors.blue2,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  errorFloating: {
    borderWidth: 1,
    borderColor: colors.blue1,
    marginBottom: 20,
    marginHorizontal: 20,
    borderRadius: 8,
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
