import {useState} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {cleanError} from '#/lib/strings/errors'
import {isNative} from '#/platform/detection'
import {useAgent, useSession} from '#/state/session'
import {ErrorMessage} from '#/view/com/util/error/ErrorMessage'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {Lock_Stroke2_Corner0_Rounded as Lock} from '#/components/icons/Lock'
import {Loader} from '#/components/Loader'
import {P, Text} from '#/components/Typography'

enum Stages {
  Email,
  ConfirmCode,
}

export function DisableEmail2FADialog({
  control,
}: {
  control: Dialog.DialogOuterProps['control']
}) {
  const {_} = useLingui()
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const {currentAccount} = useSession()
  const agent = useAgent()

  const [stage, setStage] = useState<Stages>(Stages.Email)
  const [confirmationCode, setConfirmationCode] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  const onSendEmail = async () => {
    setError('')
    setIsProcessing(true)
    try {
      await agent.com.atproto.server.requestEmailUpdate()
      setStage(Stages.ConfirmCode)
    } catch (e) {
      setError(cleanError(String(e)))
    } finally {
      setIsProcessing(false)
    }
  }

  const onConfirmDisable = async () => {
    setError('')
    setIsProcessing(true)
    try {
      if (currentAccount?.email) {
        await agent.com.atproto.server.updateEmail({
          email: currentAccount!.email,
          token: confirmationCode.trim(),
          emailAuthFactor: false,
        })
        await agent.resumeSession(agent.session!)
        Toast.show(_(msg`Email 2FA disabled`))
      }
      control.close()
    } catch (e) {
      const errMsg = String(e)
      if (errMsg.includes('Token is invalid')) {
        setError(_(msg`Invalid 2FA confirmation code.`))
      } else {
        setError(cleanError(errMsg))
      }
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <Dialog.ScrollableInner
        accessibilityDescribedBy="dialog-description"
        accessibilityLabelledBy="dialog-title">
        <View style={[a.relative, a.gap_md, a.w_full]}>
          <Text
            nativeID="dialog-title"
            style={[a.text_2xl, a.font_bold, t.atoms.text]}>
            <Trans>Disable Email 2FA</Trans>
          </Text>
          <P nativeID="dialog-description">
            {stage === Stages.ConfirmCode ? (
              <Trans>
                An email has been sent to{' '}
                {currentAccount?.email || '(no email)'}. It includes a
                confirmation code which you can enter below.
              </Trans>
            ) : (
              <Trans>
                To disable the email 2FA method, please verify your access to
                the email address.
              </Trans>
            )}
          </P>

          {error ? <ErrorMessage message={error} /> : undefined}

          {stage === Stages.Email ? (
            <View
              style={[
                a.gap_sm,
                gtMobile && [a.flex_row, a.justify_end, a.gap_md],
              ]}>
              <Button
                testID="sendEmailButton"
                variant="solid"
                color="primary"
                size={gtMobile ? 'small' : 'large'}
                onPress={onSendEmail}
                label={_(msg`Send verification email`)}
                disabled={isProcessing}>
                <ButtonText>
                  <Trans>Send verification email</Trans>
                </ButtonText>
                {isProcessing && <ButtonIcon icon={Loader} />}
              </Button>
              <Button
                testID="haveCodeButton"
                variant="ghost"
                color="primary"
                size={gtMobile ? 'small' : 'large'}
                onPress={() => setStage(Stages.ConfirmCode)}
                label={_(msg`I have a code`)}
                disabled={isProcessing}>
                <ButtonText>
                  <Trans>I have a code</Trans>
                </ButtonText>
              </Button>
            </View>
          ) : stage === Stages.ConfirmCode ? (
            <View>
              <View style={[a.mb_md]}>
                <TextField.LabelText>
                  <Trans>Confirmation code</Trans>
                </TextField.LabelText>
                <TextField.Root>
                  <TextField.Icon icon={Lock} />
                  <Dialog.Input
                    testID="confirmationCode"
                    label={_(msg`Confirmation code`)}
                    autoCapitalize="none"
                    autoFocus
                    autoCorrect={false}
                    autoComplete="off"
                    value={confirmationCode}
                    onChangeText={setConfirmationCode}
                    onSubmitEditing={onConfirmDisable}
                    editable={!isProcessing}
                  />
                </TextField.Root>
              </View>
              <View
                style={[
                  a.gap_sm,
                  gtMobile && [a.flex_row, a.justify_end, a.gap_md],
                ]}>
                <Button
                  testID="resendCodeBtn"
                  variant="ghost"
                  color="primary"
                  size={gtMobile ? 'small' : 'large'}
                  onPress={onSendEmail}
                  label={_(msg`Resend email`)}
                  disabled={isProcessing}>
                  <ButtonText>
                    <Trans>Resend email</Trans>
                  </ButtonText>
                </Button>
                <Button
                  testID="confirmBtn"
                  variant="solid"
                  color="primary"
                  size={gtMobile ? 'small' : 'large'}
                  onPress={onConfirmDisable}
                  label={_(msg`Confirm`)}
                  disabled={isProcessing}>
                  <ButtonText>
                    <Trans>Confirm</Trans>
                  </ButtonText>
                  {isProcessing && <ButtonIcon icon={Loader} />}
                </Button>
              </View>
            </View>
          ) : undefined}

          {!gtMobile && isNative && <View style={{height: 40}} />}
        </View>
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}
