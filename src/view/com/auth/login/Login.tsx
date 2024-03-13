import React, {useState, useEffect} from 'react'
import {KeyboardAvoidingView} from 'react-native'
import {useAnalytics} from 'lib/analytics/analytics'
import {LoggedOutLayout} from 'view/com/util/layouts/LoggedOutLayout'
import {DEFAULT_SERVICE} from '#/lib/constants'
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
import {useServiceQuery} from '#/state/queries/service'
import {useLoggedOutView} from '#/state/shell/logged-out'

enum Forms {
  Login,
  ChooseAccount,
  ForgotPassword,
  SetNewPassword,
  PasswordUpdated,
}

export const Login = ({onPressBack}: {onPressBack: () => void}) => {
  const {_} = useLingui()
  const pal = usePalette('default')

  const {accounts} = useSession()
  const {track} = useAnalytics()
  const {requestedAccountSwitchTo} = useLoggedOutView()
  const requestedAccount = accounts.find(
    a => a.did === requestedAccountSwitchTo,
  )

  const [error, setError] = useState<string>('')
  const [serviceUrl, setServiceUrl] = useState<string>(
    requestedAccount?.service || DEFAULT_SERVICE,
  )
  const [initialHandle, setInitialHandle] = useState<string>(
    requestedAccount?.handle || '',
  )
  const [currentForm, setCurrentForm] = useState<Forms>(
    requestedAccount
      ? Forms.Login
      : accounts.length
      ? Forms.ChooseAccount
      : Forms.Login,
  )

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
    setCurrentForm(Forms.Login)
  }

  const gotoForm = (form: Forms) => () => {
    setError('')
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
    } else {
      setError('')
    }
  }, [serviceError, serviceUrl, _])

  const onPressRetryConnect = () => refetchService()
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
        <LoggedOutLayout
          leadin=""
          title={_(msg`Password updated`)}
          description={_(msg`You can now sign in with your new password.`)}>
          <PasswordUpdatedForm onPressNext={gotoForm(Forms.Login)} />
        </LoggedOutLayout>
      ) : undefined}
    </KeyboardAvoidingView>
  )
}
