import React, {useState, useEffect} from 'react'
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import * as EmailValidator from 'email-validator'
import {sessionClient as AtpApi, SessionServiceClient} from '@atproto/api'
import {Logo} from './Logo'
import {Text} from '../util/text/Text'
import {s, colors} from '../../lib/styles'
import {createFullHandle, toNiceDomain} from '../../../lib/strings'
import {useStores, RootStoreModel, DEFAULT_SERVICE} from '../../../state'
import {ServiceDescription} from '../../../state/models/session'
import {ServerInputModal} from '../../../state/models/shell-ui'
import {isNetworkError} from '../../../lib/errors'

enum Forms {
  Login,
  ForgotPassword,
  SetNewPassword,
  PasswordUpdated,
}

export const Signin = ({onPressBack}: {onPressBack: () => void}) => {
  const store = useStores()
  const [error, setError] = useState<string>('')
  const [retryDescribeTrigger, setRetryDescribeTrigger] = useState<any>({})
  const [serviceUrl, setServiceUrl] = useState<string>(DEFAULT_SERVICE)
  const [serviceDescription, setServiceDescription] = useState<
    ServiceDescription | undefined
  >(undefined)
  const [currentForm, setCurrentForm] = useState<Forms>(Forms.Login)

  const gotoForm = (form: Forms) => () => {
    setError('')
    setCurrentForm(form)
  }

  useEffect(() => {
    let aborted = false
    setError('')
    store.session.describeService(serviceUrl).then(
      desc => {
        if (aborted) return
        setServiceDescription(desc)
      },
      err => {
        if (aborted) return
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
  }, [store.session, store.log, serviceUrl, retryDescribeTrigger])

  const onPressRetryConnect = () => setRetryDescribeTrigger({})

  return (
    <KeyboardAvoidingView behavior="padding" style={{flex: 1}}>
      <View style={styles.logoHero}>
        <Logo />
      </View>
      {currentForm === Forms.Login ? (
        <LoginForm
          store={store}
          error={error}
          serviceUrl={serviceUrl}
          serviceDescription={serviceDescription}
          setError={setError}
          setServiceUrl={setServiceUrl}
          onPressBack={onPressBack}
          onPressForgotPassword={gotoForm(Forms.ForgotPassword)}
          onPressRetryConnect={onPressRetryConnect}
        />
      ) : undefined}
      {currentForm === Forms.ForgotPassword ? (
        <ForgotPasswordForm
          store={store}
          error={error}
          serviceUrl={serviceUrl}
          serviceDescription={serviceDescription}
          setError={setError}
          setServiceUrl={setServiceUrl}
          onPressBack={gotoForm(Forms.Login)}
          onEmailSent={gotoForm(Forms.SetNewPassword)}
        />
      ) : undefined}
      {currentForm === Forms.SetNewPassword ? (
        <SetNewPasswordForm
          store={store}
          error={error}
          serviceUrl={serviceUrl}
          setError={setError}
          onPressBack={gotoForm(Forms.ForgotPassword)}
          onPasswordSet={gotoForm(Forms.PasswordUpdated)}
        />
      ) : undefined}
      {currentForm === Forms.PasswordUpdated ? (
        <PasswordUpdatedForm onPressNext={gotoForm(Forms.Login)} />
      ) : undefined}
    </KeyboardAvoidingView>
  )
}

const LoginForm = ({
  store,
  error,
  serviceUrl,
  serviceDescription,
  setError,
  setServiceUrl,
  onPressRetryConnect,
  onPressBack,
  onPressForgotPassword,
}: {
  store: RootStoreModel
  error: string
  serviceUrl: string
  serviceDescription: ServiceDescription | undefined
  setError: (v: string) => void
  setServiceUrl: (v: string) => void
  onPressRetryConnect: () => void
  onPressBack: () => void
  onPressForgotPassword: () => void
}) => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [handle, setHandle] = useState<string>('')
  const [password, setPassword] = useState<string>('')

  const onPressSelectService = () => {
    store.shell.openModal(new ServerInputModal(serviceUrl, setServiceUrl))
    Keyboard.dismiss()
  }

  const onPressNext = async () => {
    setError('')
    setIsProcessing(true)

    try {
      // try to guess the handle if the user just gave their own username
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
      store.log.warn('Failed to login', e)
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

  const isReady = !!serviceDescription && !!handle && !!password
  return (
    <>
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
          <TouchableOpacity
            style={styles.textInputInnerBtn}
            onPress={onPressForgotPassword}>
            <Text style={styles.textInputInnerBtnLabel}>Forgot</Text>
          </TouchableOpacity>
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
        {!serviceDescription && error ? (
          <TouchableOpacity onPress={onPressRetryConnect}>
            <Text style={[s.white, s.f18, s.bold, s.pr5]}>Retry</Text>
          </TouchableOpacity>
        ) : !serviceDescription ? (
          <>
            <ActivityIndicator color="#fff" />
            <Text style={[s.white, s.f18, s.pl10]}>Connecting...</Text>
          </>
        ) : isProcessing ? (
          <ActivityIndicator color="#fff" />
        ) : isReady ? (
          <TouchableOpacity onPress={onPressNext}>
            <Text style={[s.white, s.f18, s.bold, s.pr5]}>Next</Text>
          </TouchableOpacity>
        ) : undefined}
      </View>
    </>
  )
}

const ForgotPasswordForm = ({
  store,
  error,
  serviceUrl,
  serviceDescription,
  setError,
  setServiceUrl,
  onPressBack,
  onEmailSent,
}: {
  store: RootStoreModel
  error: string
  serviceUrl: string
  serviceDescription: ServiceDescription | undefined
  setError: (v: string) => void
  setServiceUrl: (v: string) => void
  onPressBack: () => void
  onEmailSent: () => void
}) => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [email, setEmail] = useState<string>('')

  const onPressSelectService = () => {
    store.shell.openModal(new ServerInputModal(serviceUrl, setServiceUrl))
  }

  const onPressNext = async () => {
    if (!EmailValidator.validate(email)) {
      return setError('Your email appears to be invalid.')
    }

    setError('')
    setIsProcessing(true)

    try {
      const api = AtpApi.service(serviceUrl) as SessionServiceClient
      await api.com.atproto.account.requestPasswordReset({email})
      onEmailSent()
    } catch (e: any) {
      const errMsg = e.toString()
      store.log.warn('Failed to request password reset', e)
      setIsProcessing(false)
      if (isNetworkError(e)) {
        setError(
          'Unable to contact your service. Please check your Internet connection.',
        )
      } else {
        setError(errMsg.replace(/^Error:/, ''))
      }
    }
  }

  return (
    <>
      <Text style={styles.screenTitle}>Reset password</Text>
      <Text style={styles.instructions}>
        Enter the email you used to create your account. We'll send you a "reset
        code" so you can set a new password.
      </Text>
      <View style={styles.group}>
        <TouchableOpacity
          style={[styles.groupContent, {borderTopWidth: 0}]}
          onPress={onPressSelectService}>
          <FontAwesomeIcon icon="globe" style={styles.groupContentIcon} />
          <Text style={styles.textInput} numberOfLines={1}>
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
        <View style={styles.groupContent}>
          <FontAwesomeIcon icon="envelope" style={styles.groupContentIcon} />
          <TextInput
            style={styles.textInput}
            placeholder="Email address"
            placeholderTextColor={colors.blue0}
            autoCapitalize="none"
            autoFocus
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
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
        {!serviceDescription || isProcessing ? (
          <ActivityIndicator color="#fff" />
        ) : !email ? (
          <Text style={[s.blue1, s.f18, s.bold, s.pr5]}>Next</Text>
        ) : (
          <TouchableOpacity onPress={onPressNext}>
            <Text style={[s.white, s.f18, s.bold, s.pr5]}>Next</Text>
          </TouchableOpacity>
        )}
        {!serviceDescription || isProcessing ? (
          <Text style={[s.white, s.f18, s.pl10]}>Processing...</Text>
        ) : undefined}
      </View>
    </>
  )
}

const SetNewPasswordForm = ({
  store,
  error,
  serviceUrl,
  setError,
  onPressBack,
  onPasswordSet,
}: {
  store: RootStoreModel
  error: string
  serviceUrl: string
  setError: (v: string) => void
  onPressBack: () => void
  onPasswordSet: () => void
}) => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [resetCode, setResetCode] = useState<string>('')
  const [password, setPassword] = useState<string>('')

  const onPressNext = async () => {
    setError('')
    setIsProcessing(true)

    try {
      const api = AtpApi.service(serviceUrl) as SessionServiceClient
      await api.com.atproto.account.resetPassword({token: resetCode, password})
      onPasswordSet()
    } catch (e: any) {
      const errMsg = e.toString()
      store.log.warn('Failed to set new password', e)
      setIsProcessing(false)
      if (isNetworkError(e)) {
        setError(
          'Unable to contact your service. Please check your Internet connection.',
        )
      } else {
        setError(errMsg.replace(/^Error:/, ''))
      }
    }
  }

  return (
    <>
      <Text style={styles.screenTitle}>Set new password</Text>
      <Text style={styles.instructions}>
        You will receive an email with a "reset code." Enter that code here,
        then enter your new password.
      </Text>
      <View style={styles.group}>
        <View style={[styles.groupContent, {borderTopWidth: 0}]}>
          <FontAwesomeIcon icon="ticket" style={styles.groupContentIcon} />
          <TextInput
            style={[styles.textInput]}
            placeholder="Reset code"
            placeholderTextColor={colors.blue0}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            value={resetCode}
            onChangeText={setResetCode}
            editable={!isProcessing}
          />
        </View>
        <View style={styles.groupContent}>
          <FontAwesomeIcon icon="lock" style={styles.groupContentIcon} />
          <TextInput
            style={styles.textInput}
            placeholder="New password"
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
        {isProcessing ? (
          <ActivityIndicator color="#fff" />
        ) : !resetCode || !password ? (
          <Text style={[s.blue1, s.f18, s.bold, s.pr5]}>Next</Text>
        ) : (
          <TouchableOpacity onPress={onPressNext}>
            <Text style={[s.white, s.f18, s.bold, s.pr5]}>Next</Text>
          </TouchableOpacity>
        )}
        {isProcessing ? (
          <Text style={[s.white, s.f18, s.pl10]}>Updating...</Text>
        ) : undefined}
      </View>
    </>
  )
}

const PasswordUpdatedForm = ({onPressNext}: {onPressNext: () => void}) => {
  return (
    <>
      <Text style={styles.screenTitle}>Password updated!</Text>
      <Text style={styles.instructions}>
        You can now sign in with your new password.
      </Text>
      <View style={[s.flexRow, s.alignCenter, s.pl20, s.pr20]}>
        <View style={s.flex1} />
        <TouchableOpacity onPress={onPressNext}>
          <Text style={[s.white, s.f18, s.bold, s.pr5]}>Okay</Text>
        </TouchableOpacity>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  screenTitle: {
    color: colors.white,
    fontSize: 26,
    marginBottom: 10,
    marginHorizontal: 20,
  },
  instructions: {
    color: colors.white,
    fontSize: 16,
    marginBottom: 20,
    marginHorizontal: 20,
  },
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
  textInputInnerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginHorizontal: 6,
  },
  textInputInnerBtnLabel: {
    color: colors.white,
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
