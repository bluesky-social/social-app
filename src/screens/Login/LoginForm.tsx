import {useState} from 'react'
import {View} from 'react-native'
import {type ComAtprotoServerDescribeServer} from '@atproto/api'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {cleanError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {oauthCreateAccount, oauthSignIn} from '#/state/session/oauth-web-client'
import {atoms as a} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {FormError} from '#/components/forms/FormError'
import * as TextField from '#/components/forms/TextField'
import {At_Stroke2_Corner0_Rounded as At} from '#/components/icons/At'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {FormContainer} from './FormContainer'

type ServiceDescription = ComAtprotoServerDescribeServer.OutputSchema

/**
 * Eurosky OAuth sign-in. Replaces the upstream password / 2FA / hosting-
 * provider form: the user enters a handle and is redirected to their auth
 * server; "Create account" goes straight to the Eurosky PDS signup. The
 * callback returns to the site root and App.web.tsx finishes login.
 *
 * The prop type is kept identical to upstream so screens/Login/index.tsx is
 * untouched; only the props this OAuth flow needs are read.
 */
export const LoginForm = ({
  error,
  initialHandle,
  setError,
  onPressBack,
}: {
  error: string
  serviceUrl: string
  serviceDescription: ServiceDescription | undefined
  initialHandle: string
  setError: (v: string) => void
  setServiceUrl: (v: string) => void
  onPressRetryConnect: () => void
  onPressBack: () => void
  onPressForgotPassword: () => void
  onAttemptSuccess: () => void
  onAttemptFailed: () => void
}) => {
  const {_} = useLingui()
  const [isProcessing, setIsProcessing] = useState(false)
  const [handle, setHandle] = useState(initialHandle)

  const onPressSignIn = async () => {
    if (isProcessing) return
    const value = handle.trim().replace(/^@/, '')
    if (!value) {
      setError(_(msg`Please enter your handle to sign in.`))
      return
    }
    setError('')
    setIsProcessing(true)
    try {
      // Redirects away on success; only resolves/throws on failure.
      await oauthSignIn(value)
    } catch (e) {
      logger.warn('oauth: signIn failed', {message: String(e)})
      setError(cleanError(e))
      setIsProcessing(false)
    }
  }

  const onPressCreateAccount = async () => {
    if (isProcessing) return
    setError('')
    setIsProcessing(true)
    try {
      await oauthCreateAccount()
    } catch (e) {
      logger.warn('oauth: createAccount failed', {message: String(e)})
      setError(cleanError(e))
      setIsProcessing(false)
    }
  }

  return (
    <FormContainer testID="loginForm" titleText={<Trans>Sign in</Trans>}>
      <View>
        <TextField.LabelText>
          <Trans>Account handle</Trans>
        </TextField.LabelText>
        <TextField.Root>
          <TextField.Icon icon={At} />
          <TextField.Input
            testID="loginHandleInput"
            label={_(msg`Account handle`)}
            autoCapitalize="none"
            autoFocus
            autoCorrect={false}
            autoComplete="username"
            keyboardType="default"
            returnKeyType="go"
            defaultValue={initialHandle}
            onChangeText={setHandle}
            onSubmitEditing={() => void onPressSignIn()}
            blurOnSubmit={false}
            editable={!isProcessing}
            accessibilityHint={_(
              msg`Enter the handle of the account you want to sign in with`,
            )}
          />
        </TextField.Root>
        <Text style={[a.text_sm, a.mt_xs, a.pl_sm]}>
          <Trans>
            You'll be sent to your account's hosting provider to sign in
            securely.
          </Trans>
        </Text>
      </View>

      <FormError error={error} />

      <View style={[a.gap_sm]}>
        <Button
          testID="loginSignInButton"
          label={_(msg`Sign in`)}
          accessibilityHint={_(msg`Sign in with your handle via OAuth`)}
          variant="solid"
          color="primary"
          size="large"
          onPress={() => void onPressSignIn()}
          disabled={isProcessing}>
          <ButtonText>
            <Trans>Sign in</Trans>
          </ButtonText>
          {isProcessing && <ButtonIcon icon={Loader} />}
        </Button>
        <Button
          testID="loginCreateAccountButton"
          label={_(msg`Create a new account`)}
          accessibilityHint={_(msg`Create a new Eurosky account`)}
          variant="solid"
          color="secondary"
          size="large"
          onPress={() => void onPressCreateAccount()}
          disabled={isProcessing}>
          <ButtonText>
            <Trans>Create a new account</Trans>
          </ButtonText>
        </Button>
        <Button
          testID="loginBackButton"
          label={_(msg`Back`)}
          variant="ghost"
          color="secondary"
          size="large"
          onPress={onPressBack}
          disabled={isProcessing}>
          <ButtonText>
            <Trans>Back</Trans>
          </ButtonText>
        </Button>
      </View>
    </FormContainer>
  )
}
