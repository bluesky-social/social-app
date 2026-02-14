import {useEffect, useRef, useState} from 'react'
import {KeyboardAvoidingView} from 'react-native'
import Animated, {FadeIn, LayoutAnimationConfig} from 'react-native-reanimated'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {DEFAULT_SERVICE} from '#/lib/constants'
import {logger} from '#/logger'
import {useServiceQuery} from '#/state/queries/service'
import {type SessionAccount, useSession} from '#/state/session'
import {useLoggedOutView} from '#/state/shell/logged-out'
import {LoggedOutLayout} from '#/view/com/util/layouts/LoggedOutLayout'
import {ForgotPasswordForm} from '#/screens/Login/ForgotPasswordForm'
import {LoginForm} from '#/screens/Login/LoginForm'
import {PasswordUpdatedForm} from '#/screens/Login/PasswordUpdatedForm'
import {SetNewPasswordForm} from '#/screens/Login/SetNewPasswordForm'
import {atoms as a, native} from '#/alf'
import {ScreenTransition} from '#/components/ScreenTransition'
import {useAnalytics} from '#/analytics'
import {ChooseAccountForm} from './ChooseAccountForm'
import * as AuthLayout from './components/AuthLayout'
import {AuthLayoutNavigationContext} from './components/AuthLayout/context'

enum Forms {
  Login,
  ChooseAccount,
  ForgotPassword,
  SetNewPassword,
  PasswordUpdated,
}

const OrderedForms = [
  Forms.ChooseAccount,
  Forms.Login,
  Forms.ForgotPassword,
  Forms.SetNewPassword,
  Forms.PasswordUpdated,
] as const

export const Login = ({onPressBack}: {onPressBack: () => void}) => {
  const {_} = useLingui()
  const failedAttemptCountRef = useRef(0)
  const startTimeRef = useRef(Date.now())

  const {accounts} = useSession()
  const {requestedAccountSwitchTo} = useLoggedOutView()
  const requestedAccount = accounts.find(
    acc => acc.did === requestedAccountSwitchTo,
  )

  const [error, setError] = useState('')
  const [serviceUrl, setServiceUrl] = useState(
    requestedAccount?.service || DEFAULT_SERVICE,
  )
  const [initialHandle, setInitialHandle] = useState(
    requestedAccount?.handle || '',
  )
  const [currentForm, setCurrentForm] = useState<Forms>(
    requestedAccount
      ? Forms.Login
      : accounts.length
        ? Forms.ChooseAccount
        : Forms.Login,
  )
  const [screenTransitionDirection, setScreenTransitionDirection] = useState<
    'Forward' | 'Backward'
  >('Forward')

  const ax = useAnalytics()
  const {
    data: serviceDescription,
    error: serviceError,
    refetch: refetchService,
  } = useServiceQuery(serviceUrl)

  const onSelectAccount = (account?: SessionAccount) => {
    if (account?.service) {
      setServiceUrl(account.service)
    }
    setInitialHandle(account?.handle || '')
    gotoForm(Forms.Login)
  }

  const gotoForm = (form: Forms) => {
    setError('')
    const index = OrderedForms.indexOf(currentForm)
    const nextIndex = OrderedForms.indexOf(form)
    setScreenTransitionDirection(index < nextIndex ? 'Forward' : 'Backward')
    setCurrentForm(form)
  }

  useEffect(() => {
    if (serviceError) {
      setError(
        _(
          msg`Unable to contact your service. Please check your Internet connection.`,
        ),
      )
      logger.warn(`Failed to fetch service description for ${serviceUrl}`, {
        error: String(serviceError),
      })
      ax.metric('signin:hostingProviderFailedResolution', {})
    } else {
      setError('')
    }
  }, [serviceError, serviceUrl, _])

  const onPressForgotPassword = () => {
    gotoForm(Forms.ForgotPassword)
    ax.metric('signin:forgotPasswordPressed', {})
  }

  const handlePressBack = () => {
    onPressBack()
    setScreenTransitionDirection('Backward')
    ax.metric('signin:backPressed', {
      failedAttemptsCount: failedAttemptCountRef.current,
    })
  }

  const onAttemptSuccess = () => {
    ax.metric('signin:success', {
      isUsingCustomProvider: serviceUrl !== DEFAULT_SERVICE,
      timeTakenSeconds: Math.round((Date.now() - startTimeRef.current) / 1000),
      failedAttemptsCount: failedAttemptCountRef.current,
    })
  }

  const onAttemptFailed = () => {
    failedAttemptCountRef.current += 1
  }

  let content = null
  let title = ''
  let description = ''
  let goBack = null

  switch (currentForm) {
    case Forms.Login:
      title = _(msg`Sign in`)
      description = _(msg`Enter your username and password`)
      goBack = () =>
        accounts.length ? gotoForm(Forms.ChooseAccount) : handlePressBack()
      content = (
        <LoginForm
          error={error}
          serviceUrl={serviceUrl}
          serviceDescription={serviceDescription}
          initialHandle={initialHandle}
          setError={setError}
          onAttemptFailed={onAttemptFailed}
          onAttemptSuccess={onAttemptSuccess}
          setServiceUrl={setServiceUrl}
          onPressBack={goBack}
          onPressForgotPassword={onPressForgotPassword}
          onPressRetryConnect={refetchService}
        />
      )
      break
    case Forms.ChooseAccount:
      title = _(msg`Sign in`)
      description = _(msg`Select from an existing account`)
      goBack = handlePressBack
      content = (
        <ChooseAccountForm
          onSelectAccount={onSelectAccount}
          onPressBack={goBack}
        />
      )
      break
    case Forms.ForgotPassword:
      title = _(msg`Forgot Password`)
      description = _(msg`Let's get your password reset!`)
      goBack = () => gotoForm(Forms.Login)
      content = (
        <ForgotPasswordForm
          error={error}
          serviceUrl={serviceUrl}
          serviceDescription={serviceDescription}
          setError={setError}
          setServiceUrl={setServiceUrl}
          onPressBack={goBack}
          onEmailSent={() => gotoForm(Forms.SetNewPassword)}
        />
      )
      break
    case Forms.SetNewPassword:
      title = _(msg`Forgot Password`)
      description = _(msg`Let's get your password reset!`)
      goBack = () => gotoForm(Forms.ForgotPassword)
      content = (
        <SetNewPasswordForm
          error={error}
          serviceUrl={serviceUrl}
          setError={setError}
          onPressBack={goBack}
          onPasswordSet={() => gotoForm(Forms.PasswordUpdated)}
        />
      )
      break
    case Forms.PasswordUpdated:
      title = _(msg`Password updated`)
      description = _(msg`You can now sign in with your new password.`)
      content = (
        <PasswordUpdatedForm onPressNext={() => gotoForm(Forms.Login)} />
      )
      break
  }

  const navigation = goBack ? {goBack} : null

  return (
    <AuthLayoutNavigationContext value={navigation}>
      <Animated.View style={a.flex_1} entering={native(FadeIn.duration(90))}>
        <KeyboardAvoidingView
          testID="signIn"
          behavior="padding"
          style={a.flex_1}>
          <AuthLayout.Header.Outer>
            <AuthLayout.Header.BackButton />
            <AuthLayout.Header.Content />
            <AuthLayout.Header.Slot />
          </AuthLayout.Header.Outer>
          <LoggedOutLayout
            leadin=""
            title={title}
            description={description}
            scrollable>
            <LayoutAnimationConfig skipEntering>
              <ScreenTransition
                key={currentForm}
                direction={screenTransitionDirection}>
                {content}
              </ScreenTransition>
            </LayoutAnimationConfig>
          </LoggedOutLayout>
        </KeyboardAvoidingView>
      </Animated.View>
    </AuthLayoutNavigationContext>
  )
}
