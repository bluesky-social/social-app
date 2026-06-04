import {useRef, useState} from 'react'
import {Keyboard, type TextInput, View} from 'react-native'
import {
  ComAtprotoServerCreateSession,
  type ComAtprotoServerDescribeServer,
} from '@atproto/api'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {useRequestNotificationsPermission} from '#/lib/notifications/notifications'
import {cleanError, isNetworkError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {useSetHasCheckedForStarterPack} from '#/state/preferences/used-starter-packs'
import {useSessionApi} from '#/state/session'
import {resolvePdsFromIdentifier} from '#/state/session/resolve-pds'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {atoms as a, useTheme, web} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {FormError} from '#/components/forms/FormError'
import * as TextField from '#/components/forms/TextField'
import {At_Stroke2_Corner0_Rounded as At} from '#/components/icons/At'
import {Lock_Stroke2_Corner0_Rounded as Lock} from '#/components/icons/Lock'
import {Ticket_Stroke2_Corner0_Rounded as Ticket} from '#/components/icons/Ticket'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {IS_IOS, IS_WEB} from '#/env'
import {FormContainer} from './FormContainer'

type ServiceDescription = ComAtprotoServerDescribeServer.OutputSchema

/**
 * Eurosky fork: password sign-in. Reimplements the upstream password/2FA
 * login WITHOUT the hosting-provider picker - the PDS is resolved from the
 * handle (handle -> DID -> #atproto_pds). Fork-owned so upstream
 * LoginForm.tsx stays pristine (zero merge surface). Prop type is kept
 * identical to upstream LoginForm so screens/Login/index.tsx passes the
 * same props regardless of which form it renders.
 */
export const PasswordSignin = ({
  error,
  initialHandle,
  setError,
  onPressBack,
  onPressForgotPassword,
  onAttemptSuccess,
  onAttemptFailed,
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
  const t = useTheme()
  const {_} = useLingui()
  const {login} = useSessionApi()
  const requestNotificationsPermission = useRequestNotificationsPermission()
  const {setShowLoggedOut} = useLoggedOutViewControls()
  const setHasCheckedForStarterPack = useSetHasCheckedForStarterPack()

  const [isProcessing, setIsProcessing] = useState(false)
  const [errorField, setErrorField] = useState<
    'none' | 'identifier' | 'password' | '2fa'
  >('none')
  const [isAuthFactorTokenNeeded, setIsAuthFactorTokenNeeded] = useState(false)
  const [authFactorToken, setAuthFactorToken] = useState('')

  const identifierValueRef = useRef<string>(initialHandle || '')
  const passwordValueRef = useRef<string>('')
  const identifierRef = useRef<TextInput>(null)
  const passwordRef = useRef<TextInput>(null)
  const hasFocusedOnce = useRef(false)

  const onPressNext = async () => {
    if (isProcessing) return
    Keyboard.dismiss()
    setError('')
    setErrorField('none')

    const identifier = identifierValueRef.current.toLowerCase().trim()
    const password = passwordValueRef.current

    if (!identifier) {
      setError(_(msg`Please enter your handle`))
      setErrorField('identifier')
      return
    }
    if (!password) {
      setError(_(msg`Please enter your password`))
      setErrorField('password')
      return
    }

    setIsProcessing(true)
    try {
      // No hosting-provider picker: resolve the account's PDS from the
      // handle so non-Bluesky-hosted accounts (e.g. Eurosky's PDS) work.
      const service = await resolvePdsFromIdentifier(identifier)
      await login(
        {
          service,
          identifier,
          password,
          authFactorToken: authFactorToken.trim(),
        },
        'LoginForm',
      )
      onAttemptSuccess()
      setShowLoggedOut(false)
      setHasCheckedForStarterPack(true)
      void requestNotificationsPermission('Login')
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e)
      setIsProcessing(false)
      if (
        e instanceof ComAtprotoServerCreateSession.AuthFactorTokenRequiredError
      ) {
        setIsAuthFactorTokenNeeded(true)
      } else {
        onAttemptFailed()
        if (errMsg.includes('Token is invalid')) {
          logger.debug('Failed to login due to invalid 2fa token', {
            error: errMsg,
          })
          setError(_(msg`Invalid 2FA confirmation code.`))
          setErrorField('2fa')
        } else if (
          errMsg.includes('Authentication Required') ||
          errMsg.includes('Invalid identifier or password')
        ) {
          logger.debug('Failed to login due to invalid credentials', {
            error: errMsg,
          })
          setError(_(msg`Incorrect username or password`))
        } else if (isNetworkError(e)) {
          logger.warn('Failed to login due to network error', {error: errMsg})
          setError(
            _(
              msg`Unable to contact your service. Please check your Internet connection.`,
            ),
          )
        } else {
          logger.warn('Failed to login', {error: errMsg})
          setError(cleanError(errMsg))
        }
      }
    }
  }

  return (
    <FormContainer
      testID="passwordSigninForm"
      titleText={<Trans>Sign in</Trans>}>
      <View>
        <TextField.LabelText>
          <Trans>Account</Trans>
        </TextField.LabelText>
        <View style={[a.gap_sm]}>
          <TextField.Root isInvalid={errorField === 'identifier'}>
            <TextField.Icon icon={At} />
            <TextField.Input
              testID="loginUsernameInput"
              inputRef={identifierRef}
              label={_(msg`Handle`)}
              autoCapitalize="none"
              autoFocus={!IS_IOS}
              autoCorrect={false}
              autoComplete="username"
              returnKeyType="next"
              textContentType="username"
              defaultValue={initialHandle || ''}
              onChangeText={v => {
                identifierValueRef.current = v
                if (errorField) setErrorField('none')
              }}
              onSubmitEditing={() => {
                passwordRef.current?.focus()
              }}
              blurOnSubmit={false}
              editable={!isProcessing}
              accessibilityHint={_(
                msg`Enter your handle, e.g. name.bsky.social`,
              )}
            />
          </TextField.Root>

          <TextField.Root isInvalid={errorField === 'password'}>
            <TextField.Icon icon={Lock} />
            <TextField.Input
              testID="loginPasswordInput"
              inputRef={passwordRef}
              label={_(msg`Password`)}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="current-password"
              returnKeyType="done"
              enablesReturnKeyAutomatically={true}
              secureTextEntry={true}
              clearButtonMode="while-editing"
              onChangeText={v => {
                passwordValueRef.current = v
                if (errorField) setErrorField('none')
              }}
              onSubmitEditing={() => void onPressNext()}
              blurOnSubmit={false}
              editable={!isProcessing}
              accessibilityHint={_(msg`Enter your password`)}
              onLayout={
                IS_IOS
                  ? () => {
                      if (hasFocusedOnce.current) return
                      hasFocusedOnce.current = true
                      identifierRef.current?.focus()
                    }
                  : undefined
              }
            />
            <Button
              testID="forgotPasswordButton"
              onPress={onPressForgotPassword}
              label={_(msg`Forgot password?`)}
              accessibilityHint={_(msg`Opens password reset form`)}
              variant="solid"
              color="secondary"
              style={[
                a.rounded_sm,
                {marginLeft: 'auto', left: 6, padding: 6},
                a.z_10,
              ]}>
              <ButtonText>
                <Trans>Forgot?</Trans>
              </ButtonText>
            </Button>
          </TextField.Root>
        </View>
      </View>

      {isAuthFactorTokenNeeded && (
        <View>
          <TextField.LabelText>
            <Trans>2FA Confirmation</Trans>
          </TextField.LabelText>
          <TextField.Root isInvalid={errorField === '2fa'}>
            <TextField.Icon icon={Ticket} />
            <TextField.Input
              testID="loginAuthFactorTokenInput"
              label={_(msg`Confirmation code`)}
              autoCapitalize="none"
              autoFocus
              autoCorrect={false}
              autoComplete="one-time-code"
              returnKeyType="done"
              blurOnSubmit={false}
              value={authFactorToken}
              onChangeText={text => {
                setAuthFactorToken(text)
                if (errorField) setErrorField('none')
              }}
              onSubmitEditing={() => void onPressNext()}
              editable={!isProcessing}
              accessibilityHint={_(
                msg`Input the code which has been emailed to you`,
              )}
              style={{
                textTransform: authFactorToken === '' ? 'none' : 'uppercase',
              }}
            />
          </TextField.Root>
          <Text style={[a.text_sm, t.atoms.text_contrast_medium, a.mt_sm]}>
            <Trans>
              Check your email for a sign in code and enter it here.
            </Trans>
          </Text>
        </View>
      )}

      <FormError error={error} />

      <View style={[a.pt_md, web([a.justify_between, a.flex_row])]}>
        {IS_WEB && (
          <Button
            label={_(msg`Back`)}
            color="secondary"
            size="large"
            onPress={onPressBack}>
            <ButtonText>
              <Trans>Back</Trans>
            </ButtonText>
          </Button>
        )}
        <Button
          testID="loginNextButton"
          label={_(msg`Sign in`)}
          accessibilityHint={_(msg`Signs in with your password`)}
          color="primary"
          size="large"
          onPress={() => void onPressNext()}>
          <ButtonText>
            <Trans>Sign in</Trans>
          </ButtonText>
          {isProcessing && <ButtonIcon icon={Loader} />}
        </Button>
      </View>
    </FormContainer>
  )
}
