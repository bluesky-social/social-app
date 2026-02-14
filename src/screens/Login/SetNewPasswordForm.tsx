import {useState} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {cleanError, isNetworkError} from '#/lib/strings/errors'
import {checkAndFormatResetCode} from '#/lib/strings/password'
import {logger} from '#/logger'
import {Agent} from '#/state/session/agent'
import {atoms as a, web} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {FormError} from '#/components/forms/FormError'
import * as TextField from '#/components/forms/TextField'
import {Lock_Stroke2_Corner0_Rounded as Lock} from '#/components/icons/Lock'
import {Ticket_Stroke2_Corner0_Rounded as Ticket} from '#/components/icons/Ticket'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {IS_WEB} from '#/env'
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
  const {_} = useLingui()
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
        _(
          msg`You have entered an invalid code. It should look like XXXXX-XXXXX.`,
        ),
      )
      ax.metric('signin:passwordResetFailure', {})
      return
    }

    // TODO Better password strength check
    if (!password) {
      setError(_(msg`Please enter a password.`))
      return
    }

    setError('')
    setIsProcessing(true)

    try {
      const agent = new Agent(null, {service: serviceUrl})
      await agent.com.atproto.server.resetPassword({
        token: formattedCode,
        password,
      })
      onPasswordSet()
      ax.metric('signin:passwordResetSuccess', {})
    } catch (e: any) {
      const errMsg = e.toString()
      logger.warn('Failed to set new password', {error: e})
      ax.metric('signin:passwordResetFailure', {})
      setIsProcessing(false)
      if (isNetworkError(e)) {
        setError(
          _(
            msg`Unable to contact your service. Please check your Internet connection.`,
          ),
        )
      } else {
        setError(cleanError(errMsg))
      }
    }
  }

  const onBlur = () => {
    const formattedCode = checkAndFormatResetCode(resetCode)
    if (!formattedCode) {
      setError(
        _(
          msg`You have entered an invalid code. It should look like XXXXX-XXXXX.`,
        ),
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
            label={_(msg`Looks like XXXXX-XXXXX`)}
            autoCapitalize="none"
            autoFocus={true}
            autoCorrect={false}
            autoComplete="off"
            value={resetCode}
            onChangeText={setResetCode}
            onFocus={() => setError('')}
            onBlur={onBlur}
            editable={!isProcessing}
            accessibilityHint={_(
              msg`Input code sent to your email for password reset`,
            )}
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
            label={_(msg`Enter a password`)}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            secureTextEntry={true}
            autoComplete="new-password"
            passwordRules="minlength: 8;"
            clearButtonMode="while-editing"
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={onPressNext}
            editable={!isProcessing}
            accessibilityHint={_(msg`Input new password`)}
          />
        </TextField.Root>
      </View>

      <FormError error={error} />

      <View style={[web([a.flex_row, a.align_center]), a.pt_lg]}>
        {IS_WEB && (
          <>
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
          </>
        )}

        <Button
          label={_(msg`Next`)}
          color="primary"
          size="large"
          onPress={onPressNext}
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
