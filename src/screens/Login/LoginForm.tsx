import {useRef, useState} from 'react'
import {Keyboard, LayoutAnimation, Platform, View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {cleanError, isNetworkError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {useSessionApi} from '#/state/session'
import {getOAuthClient} from '#/state/session/oauth-client'
import {
  isHandleResolutionError,
  resolveDeactivatedHandle,
} from '#/state/session/resolveForLogin'
import {atoms as a} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {FormError} from '#/components/forms/FormError'
import * as TextField from '#/components/forms/TextField'
import {At_Stroke2_Corner0_Rounded as At} from '#/components/icons/At'
import {Loader} from '#/components/Loader'
import {FormContainer} from './FormContainer'

export const LoginForm = ({
  error,
  initialHandle,
  setError,
  onPressBack,
}: {
  error: string
  initialHandle: string
  setError: (v: string) => void
  onPressBack: () => void
}) => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const identifierValueRef = useRef<string>(initialHandle || '')
  const {_} = useLingui()
  const {login} = useSessionApi()

  const onPressNext = async () => {
    if (isProcessing) return
    Keyboard.dismiss()
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setError('')

    const identifier = identifierValueRef.current.trim()

    if (!identifier) {
      setError(_(msg`Please enter your username or handle`))
      return
    }

    setIsProcessing(true)

    try {
      const client = getOAuthClient()
      let session
      /* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- Expo OAuth types do not resolve in Linux CI */
      try {
        session = await client.signIn(identifier)
      } catch (e) {
        if (!isHandleResolutionError(e)) throw e
        const did = await resolveDeactivatedHandle(identifier)
        session = await client.signIn(did)
      }
      /* eslint-enable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */

      if (Platform.OS !== 'web' && session) {
        // On native, signIn() returns the session directly after the
        // in-app browser completes the OAuth flow.
        await login(
          {
            service: '',
            identifier: '',
            password: '',
            oauthSession: session,
          },
          'LoginForm',
        )
      }
      // On web, the browser redirects away and App.web.tsx handles the callback.
    } catch (e) {
      const errMsg = String(e)
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
      setIsProcessing(false)
      if (isNetworkError(e)) {
        logger.warn('Failed to start OAuth sign-in due to network error', {
          error: errMsg,
        })
        setError(
          _(
            msg`Unable to contact your service. Please check your Internet connection.`,
          ),
        )
      } else {
        logger.warn('Failed to start OAuth sign-in', {error: errMsg})
        setError(cleanError(errMsg))
      }
    }
  }

  return (
    <FormContainer testID="loginForm" titleText={<Trans>Sign in</Trans>}>
      <View>
        <TextField.LabelText>
          <Trans>Account</Trans>
        </TextField.LabelText>
        <View style={[a.gap_sm]}>
          <TextField.Root>
            <TextField.Icon icon={At} />
            <TextField.Input
              testID="loginUsernameInput"
              label={_(msg`Username or handle`)}
              autoCapitalize="none"
              autoFocus
              autoCorrect={false}
              autoComplete="username"
              returnKeyType="done"
              textContentType="username"
              defaultValue={initialHandle || ''}
              onChangeText={v => {
                identifierValueRef.current = v
              }}
              onSubmitEditing={onPressNext}
              editable={!isProcessing}
              accessibilityHint={_(
                msg`Enter your handle (e.g. alice.bsky.social)`,
              )}
            />
          </TextField.Root>
        </View>
      </View>
      <FormError error={error} />
      <View style={[a.flex_row, a.align_center, a.pt_md]}>
        <Button
          label={_(msg`Back`)}
          variant="solid"
          color="secondary"
          size="large"
          onPress={onPressBack}>
          <ButtonText>
            <Trans>Back</Trans>
          </ButtonText>
        </Button>
        <View style={a.flex_1} />
        <Button
          testID="loginNextButton"
          label={_(msg`Login`)}
          accessibilityHint={_(msg`Starts the sign-in process`)}
          variant="solid"
          color="primary"
          size="large"
          onPress={onPressNext}>
          <ButtonText>
            <Trans>Login</Trans>
          </ButtonText>
          {isProcessing && <ButtonIcon icon={Loader} />}
        </Button>
      </View>
    </FormContainer>
  )
}
