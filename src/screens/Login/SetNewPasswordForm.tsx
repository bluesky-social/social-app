import {useState} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {createLexClient} from '#/lib/lexClient'
import {cleanError, isNetworkError} from '#/lib/strings/errors'
import {checkAndFormatResetCode} from '#/lib/strings/password'
import {logger} from '#/logger'
import {atoms as a, web} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as TextField from '#/components/forms/TextField'
import {Lock_Stroke2_Corner0_Rounded as Lock} from '#/components/icons/Lock'
import {Ticket_Stroke2_Corner0_Rounded as Ticket} from '#/components/icons/Ticket'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {IS_WEB} from '#/env'
import {com} from '#/lexicons'
import {FormContainer} from './FormContainer'

export const SetNewPasswordForm = ({
  error,
  serviceUrl,
  setError,
  onPressBack,
  onPasswordSet,
}: {
  error: string
  serviceUrl: string
  setError: (v: string) => void
  onPressBack: () => void
  onPasswordSet: () => void
}) => {
  const {t: l} = useLingui()
  const ax = useAnalytics()

  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [resetCode, setResetCode] = useState<string>('')
  const [password, setPassword] = useState<string>('')

  const onPressNext = async () => {
    // Check that the code is correct. We do this again just incase the user enters the code after their pw and we
    // don't get to call onBlur first
    const formattedCode = checkAndFormatResetCode(resetCode)

    if (!formattedCode) {
      setError(
        l`You have entered an invalid code. It should look like XXXXX-XXXXX.`,
      )
      ax.metric('signin:passwordResetFailure', {})
      return
    }

    // TODO Better password strength check
    if (!password) {
      setError(l`Please enter a password.`)
      return
    }

    setError('')
    setIsProcessing(true)

    try {
      const client = createLexClient({service: serviceUrl})
      await client.call(com.atproto.server.resetPassword, {
        token: formattedCode,
        password,
      })
      onPasswordSet()
      ax.metric('signin:passwordResetSuccess', {})
    } catch (err) {
      logger.warn('Failed to set new password', {error: err})
      ax.metric('signin:passwordResetFailure', {})
      setIsProcessing(false)
      if (isNetworkError(err)) {
        setError(
          l`Unable to contact your service. Please check your Internet connection.`,
        )
      } else {
        setError(cleanError(err))
      }
    }
  }

  const onBlur = () => {
    const formattedCode = checkAndFormatResetCode(resetCode)
    if (!formattedCode) {
      setError(
        l`You have entered an invalid code. It should look like XXXXX-XXXXX.`,
      )
      return
    }
    setResetCode(formattedCode)
  }

  return (
    <FormContainer
      testID="setNewPasswordForm"
      titleText={<Trans>Set new password</Trans>}>
      <Text style={[a.leading_snug, a.mb_sm]}>
        <Trans>
          You will receive an email with a "reset code." Enter that code here,
          then enter your new password.
        </Trans>
      </Text>
      <View>
        <TextField.LabelText>
          <Trans>Reset code</Trans>
        </TextField.LabelText>
        <TextField.Root>
          <TextField.Icon icon={Ticket} />
          <TextField.Input
            testID="resetCodeInput"
            label={l`Looks like XXXXX-XXXXX`}
            autoCapitalize="none"
            autoFocus={true}
            autoCorrect={false}
            autoComplete="off"
            value={resetCode}
            onChangeText={setResetCode}
            onFocus={() => setError('')}
            onBlur={onBlur}
            editable={!isProcessing}
            accessibilityHint={l`Input code sent to your email for password reset`}
          />
        </TextField.Root>
      </View>
      <View>
        <TextField.LabelText>
          <Trans>New password</Trans>
        </TextField.LabelText>
        <TextField.Root>
          <TextField.Icon icon={Lock} />
          <TextField.Input
            testID="newPasswordInput"
            label={l`Enter a password`}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            secureTextEntry={true}
            autoComplete="new-password"
            passwordRules="minlength: 8;"
            clearButtonMode="while-editing"
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={() => void onPressNext()}
            editable={!isProcessing}
            accessibilityHint={l`Input new password`}
          />
        </TextField.Root>
      </View>
      {error && <Admonition type="error">{error}</Admonition>}
      <View style={[web([a.flex_row, a.align_center]), a.pt_lg]}>
        {IS_WEB && (
          <>
            <Button
              label={l`Back`}
              variant="solid"
              color="secondary"
              size="large"
              onPress={onPressBack}>
              <ButtonText>
                <Trans>Back</Trans>
              </ButtonText>
            </Button>
            <View style={a.flex_1} />
          </>
        )}

        <Button
          label={l`Next`}
          color="primary"
          size="large"
          onPress={() => void onPressNext()}
          disabled={isProcessing}>
          <ButtonText>
            <Trans>Next</Trans>
          </ButtonText>
          {isProcessing && <ButtonIcon icon={Loader} />}
        </Button>
      </View>
    </FormContainer>
  )
}
