import React from 'react'
import {KeyboardAvoidingView} from 'react-native'
import {LayoutAnimationConfig} from 'react-native-reanimated'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {DEFAULT_SERVICE} from '#/lib/constants'
import {logger} from '#/logger'
import {useServiceQuery} from '#/state/queries/service'
import {SessionAccount, useSession} from '#/state/session'
import {useLoggedOutView} from '#/state/shell/logged-out'
import {LoggedOutLayout} from '#/view/com/util/layouts/LoggedOutLayout'
import {ForgotPasswordForm} from '#/screens/Login/ForgotPasswordForm'
import {LoginForm} from '#/screens/Login/LoginForm'
import {PasswordUpdatedForm} from '#/screens/Login/PasswordUpdatedForm'
import {SetNewPasswordForm} from '#/screens/Login/SetNewPasswordForm'
import {atoms as a} from '#/alf'
import {ChooseAccountForm} from './ChooseAccountForm'
import {ScreenTransition} from './ScreenTransition'

enum Forms {
  Login,
  ChooseAccount,
  ForgotPassword,
  SetNewPassword,
  PasswordUpdated,
}

export const Login = ({onPressBack}: {onPressBack: () => void}) => {
  const {_} = useLingui()

  const {accounts} = useSession()
  const {requestedAccountSwitchTo} = useLoggedOutView()
  const requestedAccount = accounts.find(
    acc => acc.did === requestedAccountSwitchTo,
  )

  const [error, setError] = React.useState<string>('')
  const [serviceUrl, setServiceUrl] = React.useState<string>(
    requestedAccount?.service || DEFAULT_SERVICE,
  )
  const [initialHandle, setInitialHandle] = React.useState<string>(
    requestedAccount?.handle || '',
  )
  const [currentForm, setCurrentForm] = React.useState<Forms>(
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

  const gotoForm = (form: Forms) => {
    setError('')
    setCurrentForm(form)
  }

  React.useEffect(() => {
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

  const onPressForgotPassword = () => {
    setCurrentForm(Forms.ForgotPassword)
  }

  let content = null
  let title = ''
  let description = ''

  switch (currentForm) {
    case Forms.Login:
      title = _(msg`Sign in`)
      description = _(msg`Enter your username and password`)
      content = (
        <LoginForm
          error={error}
          serviceUrl={serviceUrl}
          serviceDescription={serviceDescription}
          initialHandle={initialHandle}
          setError={setError}
          setServiceUrl={setServiceUrl}
          onPressBack={() =>
            accounts.length ? gotoForm(Forms.ChooseAccount) : onPressBack()
          }
          onPressForgotPassword={onPressForgotPassword}
          onPressRetryConnect={refetchService}
        />
      )
      break
    case Forms.ChooseAccount:
      title = _(msg`Sign in`)
      description = _(msg`Select from an existing account`)
      content = (
        <ChooseAccountForm
          onSelectAccount={onSelectAccount}
          onPressBack={onPressBack}
        />
      )
      break
    case Forms.ForgotPassword:
      title = _(msg`Forgot Password`)
      description = _(msg`Let's get your password reset!`)
      content = (
        <ForgotPasswordForm
          error={error}
          serviceUrl={serviceUrl}
          serviceDescription={serviceDescription}
          setError={setError}
          setServiceUrl={setServiceUrl}
          onPressBack={() => gotoForm(Forms.Login)}
          onEmailSent={() => gotoForm(Forms.SetNewPassword)}
        />
      )
      break
    case Forms.SetNewPassword:
      title = _(msg`Forgot Password`)
      description = _(msg`Let's get your password reset!`)
      content = (
        <SetNewPasswordForm
          error={error}
          serviceUrl={serviceUrl}
          setError={setError}
          onPressBack={() => gotoForm(Forms.ForgotPassword)}
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

  return (
    <KeyboardAvoidingView testID="signIn" behavior="padding" style={a.flex_1}>
      <LoggedOutLayout
        leadin=""
        title={title}
        description={description}
        scrollable>
        <LayoutAnimationConfig skipEntering skipExiting>
          <ScreenTransition key={currentForm}>{content}</ScreenTransition>
        </LayoutAnimationConfig>
      </LoggedOutLayout>
    </KeyboardAvoidingView>
  )
}
