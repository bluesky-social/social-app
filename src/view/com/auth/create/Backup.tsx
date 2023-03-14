import React from 'react'
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {ComAtprotoAccountCreate} from '@atproto/api'
import * as EmailValidator from 'email-validator'
import {sha256} from 'js-sha256'
import {useAnalytics} from 'lib/analytics'
import {LogoTextHero} from '../Logo'
import {Picker} from '../../util/Picker'
import {TextLink} from '../../util/Link'
import {Text} from '../../util/text/Text'
import {s, colors} from 'lib/styles'
import {makeValidHandle, createFullHandle} from 'lib/strings/handles'
import {toNiceDomain} from 'lib/strings/url-helpers'
import {useStores, DEFAULT_SERVICE} from 'state/index'
import {ServiceDescription} from 'state/models/session'
import {usePalette} from 'lib/hooks/usePalette'
import {useTheme} from 'lib/ThemeContext'
import {cleanError} from 'lib/strings/errors'

export const CreateAccount = ({onPressBack}: {onPressBack: () => void}) => {
  const {track, screen, identify} = useAnalytics()
  const pal = usePalette('default')
  const theme = useTheme()
  const store = useStores()
  const [isProcessing, setIsProcessing] = React.useState<boolean>(false)
  const [serviceUrl, setServiceUrl] = React.useState<string>(DEFAULT_SERVICE)
  const [error, setError] = React.useState<string>('')
  const [retryDescribeTrigger, setRetryDescribeTrigger] = React.useState<any>(
    {},
  )
  const [serviceDescription, setServiceDescription] = React.useState<
    ServiceDescription | undefined
  >(undefined)
  const [userDomain, setUserDomain] = React.useState<string>('')
  const [inviteCode, setInviteCode] = React.useState<string>('')
  const [email, setEmail] = React.useState<string>('')
  const [password, setPassword] = React.useState<string>('')
  const [handle, setHandle] = React.useState<string>('')
  const [is13, setIs13] = React.useState<boolean>(false)

  React.useEffect(() => {
    screen('CreateAccount')
  }, [screen])

  React.useEffect(() => {
    let aborted = false
    setError('')
    setServiceDescription(undefined)
    store.session.describeService(serviceUrl).then(
      desc => {
        if (aborted) {
          return
        }
        setServiceDescription(desc)
        setUserDomain(desc.availableUserDomains[0])
      },
      err => {
        if (aborted) {
          return
        }
        store.log.warn(
          `Failed to fetch service description for ${serviceUrl}`,
          err,
        )
        setError(
          'Unable to contact your service. Please check your Internet connection.',
        )
      },
    )
    return () => {
      aborted = true
    }
  }, [serviceUrl, store.session, store.log, retryDescribeTrigger])

  const onPressRetryConnect = React.useCallback(
    () => setRetryDescribeTrigger({}),
    [setRetryDescribeTrigger],
  )

  const onPressSelectService = React.useCallback(() => {
    store.shell.openModal({
      name: 'server-input',
      initialService: serviceUrl,
      onSelect: setServiceUrl,
    })
    Keyboard.dismiss()
  }, [store, serviceUrl])

  const onBlurInviteCode = React.useCallback(() => {
    setInviteCode(inviteCode.trim())
  }, [setInviteCode, inviteCode])

  const onPressNext = React.useCallback(async () => {
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

      const email_hashed = sha256(email)
      identify(email_hashed, {email_hashed})

      track('Create Account')
    } catch (e: any) {
      let errMsg = e.toString()
      if (e instanceof ComAtprotoAccountCreate.InvalidInviteCodeError) {
        errMsg =
          'Invite code not accepted. Check that you input it correctly and try again.'
      }
      store.log.error('Failed to create account', e)
      setIsProcessing(false)
      setError(cleanError(errMsg))
    }
  }, [
    serviceUrl,
    userDomain,
    inviteCode,
    email,
    password,
    handle,
    setError,
    setIsProcessing,
    store,
    track,
    identify,
  ])

  const isReady = !!email && !!password && !!handle && is13
  return (
    <ScrollView testID="createAccount" style={pal.view}>
      <KeyboardAvoidingView behavior="padding">
        <LogoTextHero />
        {error ? (
          <View style={[styles.error, styles.errorFloating]}>
            <View style={[styles.errorIcon]}>
              <FontAwesomeIcon icon="exclamation" style={s.white} size={10} />
            </View>
            <View style={s.flex1}>
              <Text style={[s.white, s.bold]}>{error}</Text>
            </View>
          </View>
        ) : undefined}
        <View style={styles.groupLabel}>
          <Text type="sm-bold" style={pal.text}>
            Service provider
          </Text>
        </View>
        <View style={[pal.borderDark, styles.group]}>
          <View
            style={[pal.borderDark, styles.groupContent, styles.noTopBorder]}>
            <FontAwesomeIcon
              icon="globe"
              style={[pal.textLight, styles.groupContentIcon]}
            />
            <TouchableOpacity
              testID="registerSelectServiceButton"
              style={styles.textBtn}
              onPress={onPressSelectService}>
              <Text type="xl" style={[pal.text, styles.textBtnLabel]}>
                {toNiceDomain(serviceUrl)}
              </Text>
              <View style={[pal.btn, styles.textBtnFakeInnerBtn]}>
                <FontAwesomeIcon
                  icon="pen"
                  size={12}
                  style={[pal.textLight, styles.textBtnFakeInnerBtnIcon]}
                />
                <Text style={[pal.textLight]}>Change</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
        {serviceDescription ? (
          <>
            <View style={styles.groupLabel}>
              <Text type="sm-bold" style={pal.text}>
                Account details
              </Text>
            </View>
            <View style={[pal.borderDark, styles.group]}>
              {serviceDescription?.inviteCodeRequired ? (
                <View
                  style={[pal.border, styles.groupContent, styles.noTopBorder]}>
                  <FontAwesomeIcon
                    icon="ticket"
                    style={[pal.textLight, styles.groupContentIcon]}
                  />
                  <TextInput
                    style={[pal.text, styles.textInput]}
                    placeholder="Invite code"
                    placeholderTextColor={pal.colors.textLight}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoFocus
                    keyboardAppearance={theme.colorScheme}
                    value={inviteCode}
                    onChangeText={setInviteCode}
                    onBlur={onBlurInviteCode}
                    editable={!isProcessing}
                  />
                </View>
              ) : undefined}
              <View style={[pal.border, styles.groupContent]}>
                <FontAwesomeIcon
                  icon="envelope"
                  style={[pal.textLight, styles.groupContentIcon]}
                />
                <TextInput
                  testID="registerEmailInput"
                  style={[pal.text, styles.textInput]}
                  placeholder="Email address"
                  placeholderTextColor={pal.colors.textLight}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                  editable={!isProcessing}
                />
              </View>
              <View style={[pal.border, styles.groupContent]}>
                <FontAwesomeIcon
                  icon="lock"
                  style={[pal.textLight, styles.groupContentIcon]}
                />
                <TextInput
                  testID="registerPasswordInput"
                  style={[pal.text, styles.textInput]}
                  placeholder="Choose your password"
                  placeholderTextColor={pal.colors.textLight}
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  editable={!isProcessing}
                />
              </View>
            </View>
          </>
        ) : undefined}
        {serviceDescription ? (
          <>
            <View style={styles.groupLabel}>
              <Text type="sm-bold" style={pal.text}>
                Choose your username
              </Text>
            </View>
            <View style={[pal.border, styles.group]}>
              <View
                style={[pal.border, styles.groupContent, styles.noTopBorder]}>
                <FontAwesomeIcon
                  icon="at"
                  style={[pal.textLight, styles.groupContentIcon]}
                />
                <TextInput
                  testID="registerHandleInput"
                  style={[pal.text, styles.textInput]}
                  placeholder="eg alice"
                  placeholderTextColor={pal.colors.textLight}
                  autoCapitalize="none"
                  value={handle}
                  onChangeText={v => setHandle(makeValidHandle(v))}
                  editable={!isProcessing}
                />
              </View>
              {serviceDescription.availableUserDomains.length > 1 && (
                <View style={[pal.border, styles.groupContent]}>
                  <FontAwesomeIcon
                    icon="globe"
                    style={styles.groupContentIcon}
                  />
                  <Picker
                    style={[pal.text, styles.picker]}
                    labelStyle={styles.pickerLabel}
                    iconStyle={pal.textLight as FontAwesomeIconStyle}
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
              <View style={[pal.border, styles.groupContent]}>
                <Text style={[pal.textLight, s.p10]}>
                  Your full username will be{' '}
                  <Text type="md-bold" style={pal.textLight}>
                    @{createFullHandle(handle, userDomain)}
                  </Text>
                </Text>
              </View>
            </View>
            <View style={styles.groupLabel}>
              <Text type="sm-bold" style={pal.text}>
                Legal
              </Text>
            </View>
            <View style={[pal.border, styles.group]}>
              <View
                style={[pal.border, styles.groupContent, styles.noTopBorder]}>
                <TouchableOpacity
                  testID="registerIs13Input"
                  style={styles.textBtn}
                  onPress={() => setIs13(!is13)}>
                  <View
                    style={[
                      pal.border,
                      is13 ? styles.checkboxFilled : styles.checkbox,
                    ]}>
                    {is13 && (
                      <FontAwesomeIcon icon="check" style={s.blue3} size={14} />
                    )}
                  </View>
                  <Text style={[pal.text, styles.textBtnLabel]}>
                    I am 13 years old or older
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <Policies serviceDescription={serviceDescription} />
          </>
        ) : undefined}
        <View style={[s.flexRow, s.pl20, s.pr20]}>
          <TouchableOpacity onPress={onPressBack}>
            <Text type="xl" style={pal.link}>
              Back
            </Text>
          </TouchableOpacity>
          <View style={s.flex1} />
          {isReady ? (
            <TouchableOpacity
              testID="createAccountButton"
              onPress={onPressNext}>
              {isProcessing ? (
                <ActivityIndicator />
              ) : (
                <Text type="xl-bold" style={[pal.link, s.pr5]}>
                  Next
                </Text>
              )}
            </TouchableOpacity>
          ) : !serviceDescription && error ? (
            <TouchableOpacity
              testID="registerRetryButton"
              onPress={onPressRetryConnect}>
              <Text type="xl-bold" style={[pal.link, s.pr5]}>
                Retry
              </Text>
            </TouchableOpacity>
          ) : !serviceDescription ? (
            <>
              <ActivityIndicator color="#fff" />
              <Text type="xl-bold" style={[pal.link, s.pr5]}>
                Connecting...
              </Text>
            </>
          ) : undefined}
        </View>
        <View style={s.footerSpacer} />
      </KeyboardAvoidingView>
    </ScrollView>
  )
}

const Policies = ({
  serviceDescription,
}: {
  serviceDescription: ServiceDescription
}) => {
  const pal = usePalette('default')
  if (!serviceDescription) {
    return <View />
  }
  const tos = validWebLink(serviceDescription.links?.termsOfService)
  const pp = validWebLink(serviceDescription.links?.privacyPolicy)
  if (!tos && !pp) {
    return (
      <View style={styles.policies}>
        <View style={[styles.errorIcon, {borderColor: pal.colors.text}, s.mt2]}>
          <FontAwesomeIcon
            icon="exclamation"
            style={pal.textLight as FontAwesomeIconStyle}
            size={10}
          />
        </View>
        <Text style={[pal.textLight, s.pl5, s.flex1]}>
          This service has not provided terms of service or a privacy policy.
        </Text>
      </View>
    )
  }
  const els = []
  if (tos) {
    els.push(
      <TextLink
        key="tos"
        href={tos}
        text="Terms of Service"
        style={[pal.link, s.underline]}
      />,
    )
  }
  if (pp) {
    els.push(
      <TextLink
        key="pp"
        href={pp}
        text="Privacy Policy"
        style={[pal.link, s.underline]}
      />,
    )
  }
  if (els.length === 2) {
    els.splice(
      1,
      0,
      <Text key="and" style={pal.textLight}>
        {' '}
        and{' '}
      </Text>,
    )
  }
  return (
    <View style={styles.policies}>
      <Text style={pal.textLight}>
        By creating an account you agree to the {els}.
      </Text>
    </View>
  )
}

function validWebLink(url?: string): string | undefined {
  return url && (url.startsWith('http://') || url.startsWith('https://'))
    ? url
    : undefined
}

const styles = StyleSheet.create({
  noTopBorder: {
    borderTopWidth: 0,
  },
  logoHero: {
    paddingTop: 30,
    paddingBottom: 40,
  },
  group: {
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 20,
    marginHorizontal: 20,
  },
  groupLabel: {
    paddingHorizontal: 20,
    paddingBottom: 5,
  },
  groupContent: {
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupContentIcon: {
    marginLeft: 10,
  },
  textInput: {
    flex: 1,
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 17,
    letterSpacing: 0.25,
    fontWeight: '400',
    borderRadius: 10,
  },
  textBtn: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  textBtnLabel: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  textBtnFakeInnerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginHorizontal: 6,
  },
  textBtnFakeInnerBtnIcon: {
    marginRight: 4,
  },
  picker: {
    flex: 1,
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 17,
    borderRadius: 10,
  },
  pickerLabel: {
    fontSize: 17,
  },
  checkbox: {
    borderWidth: 1,
    borderRadius: 2,
    width: 16,
    height: 16,
    marginLeft: 16,
  },
  checkboxFilled: {
    borderWidth: 1,
    borderRadius: 2,
    width: 16,
    height: 16,
    marginLeft: 16,
  },
  policies: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  error: {
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
    borderRadius: 30,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 5,
  },
})
