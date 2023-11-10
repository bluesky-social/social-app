import React, {useState, useEffect} from 'react'
import {KeyboardAvoidingView} from 'react-native'
import {useAnalytics} from 'lib/analytics/analytics'
import {LoggedOutLayout} from 'view/com/util/layouts/LoggedOutLayout'
import {useStores, DEFAULT_SERVICE} from 'state/index'
import {ServiceDescription} from 'state/models/session'
import {usePalette} from 'lib/hooks/usePalette'
import {logger} from '#/logger'
import {ChooseAccountForm} from './ChooseAccountForm'
import {LoginForm} from './LoginForm'
import {ForgotPasswordForm} from './ForgotPasswordForm'
import {SetNewPasswordForm} from './SetNewPasswordForm'
import {PasswordUpdatedForm} from './PasswordUpdatedForm'
import {useLingui} from '@lingui/react'
import {msg} from '@lingui/macro'
import {useSession, SessionAccount} from '#/state/session'

enum Forms {
  Login,
  ChooseAccount,
  ForgotPassword,
  SetNewPassword,
  PasswordUpdated,
}

export const Login = ({onPressBack}: {onPressBack: () => void}) => {
  const pal = usePalette('default')
  const store = useStores()
  const {accounts} = useSession()
  const {track} = useAnalytics()
  const {_} = useLingui()
  const [error, setError] = useState<string>('')
  const [retryDescribeTrigger, setRetryDescribeTrigger] = useState<any>({})
  const [serviceUrl, setServiceUrl] = useState<string>(DEFAULT_SERVICE)
  const [serviceDescription, setServiceDescription] = useState<
    ServiceDescription | undefined
  >(undefined)
  const [initialHandle, setInitialHandle] = useState<string>('')
  const [currentForm, setCurrentForm] = useState<Forms>(
    accounts.length ? Forms.ChooseAccount : Forms.Login,
  )

  const onSelectAccount = (account?: SessionAccount) => {
    if (account?.service) {
      setServiceUrl(account.service)
    }
    setInitialHandle(account?.handle || '')
    setCurrentForm(Forms.Login)
  }

  const gotoForm = (form: Forms) => () => {
    setError('')
    setCurrentForm(form)
  }

  useEffect(() => {
    let aborted = false
    setError('')
    store.session.describeService(serviceUrl).then(
      desc => {
        if (aborted) {
          return
        }
        setServiceDescription(desc)
      },
      err => {
        if (aborted) {
          return
        }
        logger.warn(`Failed to fetch service description for ${serviceUrl}`, {
          error: err,
        })
        setError(
          _(
            msg`Unable to contact your service. Please check your Internet connection.`,
          ),
        )
      },
    )
    return () => {
      aborted = true
    }
  }, [store.session, serviceUrl, retryDescribeTrigger, _])

  const onPressRetryConnect = () => setRetryDescribeTrigger({})
  const onPressForgotPassword = () => {
    track('Signin:PressedForgotPassword')
    setCurrentForm(Forms.ForgotPassword)
  }

  return (
    <KeyboardAvoidingView testID="signIn" behavior="padding" style={pal.view}>
      {currentForm === Forms.Login ? (
        <LoggedOutLayout
          leadin=""
          title={_(msg`Sign in`)}
          description={_(msg`Enter your username and password`)}>
          <LoginForm
            error={error}
            serviceUrl={serviceUrl}
            serviceDescription={serviceDescription}
            initialHandle={initialHandle}
            setError={setError}
            setServiceUrl={setServiceUrl}
            onPressBack={onPressBack}
            onPressForgotPassword={onPressForgotPassword}
            onPressRetryConnect={onPressRetryConnect}
          />
        </LoggedOutLayout>
      ) : undefined}
      {currentForm === Forms.ChooseAccount ? (
        <LoggedOutLayout
          leadin=""
          title={_(msg`Sign in as...`)}
          description={_(msg`Select from an existing account`)}>
          <ChooseAccountForm
            onSelectAccount={onSelectAccount}
            onPressBack={onPressBack}
          />
        </LoggedOutLayout>
      ) : undefined}
      {currentForm === Forms.ForgotPassword ? (
        <LoggedOutLayout
          leadin=""
          title={_(msg`Forgot Password`)}
          description={_(msg`Let's get your password reset!`)}>
          <ForgotPasswordForm
            error={error}
            serviceUrl={serviceUrl}
            serviceDescription={serviceDescription}
            setError={setError}
            setServiceUrl={setServiceUrl}
            onPressBack={gotoForm(Forms.Login)}
            onEmailSent={gotoForm(Forms.SetNewPassword)}
          />
        </LoggedOutLayout>
      ) : undefined}
      {currentForm === Forms.SetNewPassword ? (
        <LoggedOutLayout
          leadin=""
          title={_(msg`Forgot Password`)}
          description={_(msg`Let's get your password reset!`)}>
          <SetNewPasswordForm
            error={error}
            serviceUrl={serviceUrl}
            setError={setError}
            onPressBack={gotoForm(Forms.ForgotPassword)}
            onPasswordSet={gotoForm(Forms.PasswordUpdated)}
          />
        </LoggedOutLayout>
      ) : undefined}
      {currentForm === Forms.PasswordUpdated ? (
        <PasswordUpdatedForm onPressNext={gotoForm(Forms.Login)} />
      ) : undefined}
    </KeyboardAvoidingView>
  )
}
