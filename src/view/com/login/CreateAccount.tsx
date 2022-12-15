import React, {useState, useEffect} from 'react'
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import * as EmailValidator from 'email-validator'
import {Logo} from './Logo'
import {Picker} from '../util/Picker'
import {TextLink} from '../util/Link'
import {s, colors} from '../../lib/styles'
import {
  makeValidHandle,
  createFullHandle,
  toNiceDomain,
} from '../../../lib/strings'
import {useStores, DEFAULT_SERVICE} from '../../../state'
import {ServiceDescription} from '../../../state/models/session'
import {ServerInputModal} from '../../../state/models/shell-ui'
import {ComAtprotoAccountCreate} from '../../../third-party/api/index'

export const CreateAccount = ({onPressBack}: {onPressBack: () => void}) => {
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
  }, [serviceUrl, store.session])

  const onPressSelectService = () => {
    store.shell.openModal(new ServerInputModal(serviceUrl, setServiceUrl))
    Keyboard.dismiss()
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

function validWebLink(url?: string): string | undefined {
  return url && (url.startsWith('http://') || url.startsWith('https://'))
    ? url
    : undefined
}

const styles = StyleSheet.create({
  logoHero: {
    paddingTop: 30,
    paddingBottom: 40,
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
