import {useEffect, useRef, useState} from 'react'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {DEFAULT_SERVICE} from '#/lib/constants'
import {
  type AuthNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {logger} from '#/logger'
import {useServiceQuery} from '#/state/queries/service'
import {type SessionAccount} from '#/state/session'
import {Logo} from '#/view/icons/Logo'
import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'
import * as Layout from './components/Layout'
import {SignInForm} from './components/SignInForm'

type Props = NativeStackScreenProps<AuthNavigatorParams, 'SignIn'>
export function SignInScreen({
  navigation,
  route: {params: {account: requestedAccount} = {}},
}: Props) {
  return (
    <SignInScreenInner
      requestedAccount={requestedAccount}
      forgotPassword={() => navigation.navigate('ForgotPassword')}
      signUp={() => navigation.navigate('SignUpInfo')}
    />
  )
}

export function SignInScreenInner({
  requestedAccount,
  forgotPassword,
  signUp,
}: {
  requestedAccount?: SessionAccount
  forgotPassword: () => void
  signUp: () => void
}) {
  const t = useTheme()
  const {_} = useLingui()
  const failedAttemptCountRef = useRef(0)
  const startTimeRef = useRef(Date.now())

  const [error, setError] = useState<string>('')
  const [serviceUrl, setServiceUrl] = useState<string>(
    requestedAccount?.service || DEFAULT_SERVICE,
  )
  const {
    data: serviceDescription,
    error: serviceError,
    refetch: refetchService,
  } = useServiceQuery(serviceUrl)

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
      logger.metric('signin:hostingProviderFailedResolution', {})
    } else {
      setError('')
    }
  }, [serviceError, serviceUrl, _])

  const onPressForgotPassword = () => {
    forgotPassword()
    logger.metric('signin:forgotPasswordPressed', {})
  }

  const onAttemptSuccess = () => {
    logger.metric('signin:success', {
      isUsingCustomProvider: serviceUrl !== DEFAULT_SERVICE,
      timeTakenSeconds: Math.round((Date.now() - startTimeRef.current) / 1000),
      failedAttemptsCount: failedAttemptCountRef.current,
    })
  }

  const onAttemptFailed = () => {
    failedAttemptCountRef.current += 1
  }

  return (
    <Layout.Screen testID="SignInScreen">
      <Layout.Header.Outer noBottomBorder>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Logo />
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content contentContainerStyle={[a.p_xl]}>
        <Text style={[a.font_heavy, a.text_3xl]}>Log in</Text>
        <SignInForm
          error={error}
          serviceUrl={serviceUrl}
          serviceDescription={serviceDescription}
          initialHandle={requestedAccount?.handle}
          setError={setError}
          onAttemptFailed={onAttemptFailed}
          onAttemptSuccess={onAttemptSuccess}
          setServiceUrl={setServiceUrl}
          onPressForgotPassword={onPressForgotPassword}
          onPressRetryConnect={refetchService}
        />
        <Text style={[a.text_md, a.text_center, a.w_full, a.mt_2xl]}>
          <Trans>
            New to Bluesky?{' '}
            <Text
              role="link"
              onPress={signUp}
              style={[a.text_md, {color: t.palette.primary_500}]}>
              Create account
            </Text>
          </Trans>
        </Text>
      </Layout.Content>
    </Layout.Screen>
  )
}
