import React, {useState, useEffect} from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
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
import {TextLink} from '../com/util/Link'
import {s, colors} from '../lib/styles'
import {
  makeValidHandle,
  createFullHandle,
  toNiceDomain,
} from '../../lib/strings'
import {useStores, DEFAULT_SERVICE} from '../../state'
import {ServiceDescription} from '../../state/models/session'
import {ServerInputModal} from '../../state/models/shell-ui'
import {ComAtprotoAccountCreate} from '../../third-party/api/index'
import {isNetworkError} from '../../lib/errors'

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
  const [serviceUrl, setServiceUrl] = useState<string>(DEFAULT_SERVICE)
  const [serviceDescription, setServiceDescription] = useState<
    ServiceDescription | undefined
  >(undefined)
  const [error, setError] = useState<string>('')
  const [handle, setHandle] = useState<string>('')
  const [password, setPassword] = useState<string>('')

  useEffect(() => {
    let aborted = false
    setError('')
    console.log('Fetching service description', serviceUrl)
    store.session.describeService(serviceUrl).then(
      desc => {
        if (aborted) return
        setServiceDescription(desc)
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
  }, [serviceUrl])

  const onPressSelectService = () => {
    store.shell.openModal(new ServerInputModal(serviceUrl, setServiceUrl))
  }

  const onPressNext = async () => {
    setError('')
    setIsProcessing(true)

    // try to guess the handle if the user just gave their own username
    try {
      let fullHandle = handle
      if (
        serviceDescription &&
        serviceDescription.availableUserDomains.length > 0
      ) {
        let matched = false
        for (const domain of serviceDescription.availableUserDomains) {
          if (fullHandle.endsWith(domain)) {
            matched = true
          }
        }
        if (!matched) {
          fullHandle = createFullHandle(
            handle,
            serviceDescription.availableUserDomains[0],
          )
        }
      }

      await store.session.login({
        service: serviceUrl,
        handle: fullHandle,
        password,
      })
    } catch (e: any) {
      const errMsg = e.toString()
      console.log(e)
      setIsProcessing(false)
      if (errMsg.includes('Authentication Required')) {
        setError('Invalid username or password')
      } else if (isNetworkError(e)) {
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
        <TouchableOpacity
          style={[styles.groupTitle, {paddingRight: 0, paddingVertical: 6}]}
          onPress={onPressSelectService}>
          <Text style={[s.flex1, s.white, s.f18, s.bold]} numberOfLines={1}>
            Sign in to {toNiceDomain(serviceUrl)}
          </Text>
          <View style={styles.textBtnFakeInnerBtn}>
            <FontAwesomeIcon
              icon="pen"
              size={12}
              style={styles.textBtnFakeInnerBtnIcon}
            />
            <Text style={styles.textBtnFakeInnerBtnLabel}>Change</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.groupContent}>
          <FontAwesomeIcon icon="at" style={styles.groupContentIcon} />
          <TextInput
            style={styles.textInput}
            placeholder="Username"
            placeholderTextColor={colors.blue0}
            autoCapitalize="none"
            autoFocus
            autoCorrect={false}
            value={handle}
            onChangeText={str => setHandle((str || '').toLowerCase())}
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
            autoCorrect={false}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!isProcessing}
          />
        </View>
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
      <View style={[s.flexRow, s.alignCenter, s.pl20, s.pr20]}>
        <TouchableOpacity onPress={onPressBack}>
          <Text style={[s.white, s.f18, s.pl5]}>Back</Text>
        </TouchableOpacity>
        <View style={s.flex1} />
        <TouchableOpacity onPress={onPressNext}>
          {!serviceDescription || isProcessing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={[s.white, s.f18, s.bold, s.pr5]}>Next</Text>
          )}
        </TouchableOpacity>
        {!serviceDescription || isProcessing ? (
          <Text style={[s.white, s.f18, s.pl10]}>Connecting...</Text>
        ) : undefined}
      </View>
    </KeyboardAvoidingView>
  )
}

const CreateAccount = ({onPressBack}: {onPressBack: () => void}) => {
  const store = useStores()
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [serviceUrl, setServiceUrl] = useState<string>(DEFAULT_SERVICE)
  const [error, setError] = useState<string>('')
  const [serviceDescription, setServiceDescription] = useState<
    ServiceDescription | undefined
  >(undefined)
  const [userDomain, setUserDomain] = useState<string>('')
  const [inviteCode, setInviteCode] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [handle, setHandle] = useState<string>('')

  useEffect(() => {
    let aborted = false
    setError('')
    setServiceDescription(undefined)
    console.log('Fetching service description', serviceUrl)
    store.session.describeService(serviceUrl).then(
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
  }, [serviceUrl])

  const onPressSelectService = () => {
    store.shell.openModal(new ServerInputModal(serviceUrl, setServiceUrl))
  }

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
    if (!handle) {
      return setError('Please choose your username.')
    }
    setError('')
    setIsProcessing(true)
    try {
      await store.session.createAccount({
        service: serviceUrl,
        email,
        handle: createFullHandle(handle, userDomain),
        password,
        inviteCode,
      })
    } catch (e: any) {
      let errMsg = e.toString()
      if (e instanceof ComAtprotoAccountCreate.InvalidInviteCodeError) {
        errMsg =
          'Invite code not accepted. Check that you input it correctly and try again.'
      }
      console.log(e)
      setIsProcessing(false)
      setError(errMsg.replace(/^Error:/, ''))
    }
  }

  const Policies = () => {
    if (!serviceDescription) {
      return <View />
    }
    const tos = validWebLink(serviceDescription.links?.termsOfService)
    const pp = validWebLink(serviceDescription.links?.privacyPolicy)
    if (!tos && !pp) {
      return (
        <View style={styles.policies}>
          <View style={[styles.errorIcon, s.mt2]}>
            <FontAwesomeIcon icon="exclamation" style={s.white} size={10} />
          </View>
          <Text style={[s.white, s.pl5, s.flex1]}>
            This service has not provided terms of service or a privacy policy.
          </Text>
        </View>
      )
    }
    const els = []
    if (tos) {
      els.push(
        <TextLink
          href={tos}
          text="Terms of Service"
          style={[s.white, s.underline]}
        />,
      )
    }
    if (pp) {
      els.push(
        <TextLink
          href={pp}
          text="Privacy Policy"
          style={[s.white, s.underline]}
        />,
      )
    }
    if (els.length === 2) {
      els.splice(1, 0, <Text style={s.white}> and </Text>)
    }
    return (
      <View style={styles.policies}>
        <Text style={s.white}>
          By creating an account you agree to the {els}.
        </Text>
      </View>
    )
  }

  return (
    <ScrollView style={{flex: 1}}>
      <KeyboardAvoidingView behavior="padding" style={{flex: 1}}>
        <View style={styles.logoHero}>
          <Logo />
        </View>
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
        <View style={[styles.group]}>
          <View style={styles.groupTitle}>
            <Text style={[s.white, s.f18, s.bold]}>Create a new account</Text>
          </View>
          <View style={styles.groupContent}>
            <FontAwesomeIcon icon="globe" style={styles.groupContentIcon} />
            <TouchableOpacity
              style={styles.textBtn}
              onPress={onPressSelectService}>
              <Text style={styles.textBtnLabel}>
                {toNiceDomain(serviceUrl)}
              </Text>
              <View style={styles.textBtnFakeInnerBtn}>
                <FontAwesomeIcon
                  icon="pen"
                  size={12}
                  style={styles.textBtnFakeInnerBtnIcon}
                />
                <Text style={styles.textBtnFakeInnerBtnLabel}>Change</Text>
              </View>
            </TouchableOpacity>
          </View>
          {serviceDescription ? (
            <>
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
                    autoCorrect={false}
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
                  autoCorrect={false}
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
                  autoCorrect={false}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  editable={!isProcessing}
                />
              </View>
            </>
          ) : undefined}
        </View>
        {serviceDescription ? (
          <>
            <View style={styles.group}>
              <View style={styles.groupTitle}>
                <Text style={[s.white, s.f18, s.bold]}>
                  Choose your username
                </Text>
              </View>
              <View style={styles.groupContent}>
                <FontAwesomeIcon icon="at" style={styles.groupContentIcon} />
                <TextInput
                  style={[styles.textInput]}
                  placeholder="eg alice"
                  placeholderTextColor={colors.blue0}
                  autoCapitalize="none"
                  value={handle}
                  onChangeText={v => setHandle(makeValidHandle(v))}
                  editable={!isProcessing}
                />
              </View>
              {serviceDescription.availableUserDomains.length > 1 && (
                <View style={styles.groupContent}>
                  <FontAwesomeIcon
                    icon="globe"
                    style={styles.groupContentIcon}
                  />
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
                    @{createFullHandle(handle, userDomain)}
                  </Text>
                </Text>
              </View>
            </View>
            <Policies />
          </>
        ) : undefined}
        <View style={[s.flexRow, s.pl20, s.pr20, {paddingBottom: 200}]}>
          <TouchableOpacity onPress={onPressBack}>
            <Text style={[s.white, s.f18, s.pl5]}>Back</Text>
          </TouchableOpacity>
          <View style={s.flex1} />
          {serviceDescription ? (
            <TouchableOpacity onPress={onPressNext}>
              {isProcessing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={[s.white, s.f18, s.bold, s.pr5]}>Next</Text>
              )}
            </TouchableOpacity>
          ) : undefined}
        </View>
      </KeyboardAvoidingView>
    </ScrollView>
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

function validWebLink(url?: string): string | undefined {
  return url && (url.startsWith('http://') || url.startsWith('https://'))
    ? url
    : undefined
}

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
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  groupTitleIcon: {
    color: colors.white,
    marginHorizontal: 6,
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
  textBtn: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  textBtnLabel: {
    flex: 1,
    color: colors.white,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 18,
  },
  textBtnIcon: {
    color: colors.white,
    marginHorizontal: 12,
  },
  textBtnFakeInnerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.blue2,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginHorizontal: 6,
  },
  textBtnFakeInnerBtnIcon: {
    color: colors.white,
    marginRight: 4,
  },
  textBtnFakeInnerBtnLabel: {
    color: colors.white,
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
  policies: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  error: {
    borderWidth: 1,
    borderColor: colors.red5,
    backgroundColor: colors.red4,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -5,
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  errorFloating: {
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
