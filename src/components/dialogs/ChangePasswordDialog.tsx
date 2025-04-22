import {useState} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import * as EmailValidator from 'email-validator'

import {cleanError, isNetworkError} from '#/lib/strings/errors'
import {checkAndFormatResetCode} from '#/lib/strings/password'
import {logger} from '#/logger'
import {useAgent, useSession} from '#/state/session'
import {ErrorMessage} from '#/view/com/util/error/ErrorMessage'
import {atoms as a, useBreakpoints, web} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

enum Stages {
  RequestCode = 'RequestCode',
  ChangePassword = 'ChangePassword',
  Done = 'Done',
}

export function ChangePasswordDialog({
  control,
}: {
  control: Dialog.DialogControlProps
}) {
  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <Inner />
    </Dialog.Outer>
  )
}

function Inner() {
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const agent = useAgent()
  const {gtMobile} = useBreakpoints()
  const control = Dialog.useDialogContext()

  const [stage, setStage] = useState(Stages.RequestCode)
  const [isProcessing, setIsProcessing] = useState(false)
  const [resetCode, setResetCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')

  const uiStrings = {
    RequestCode: {
      title: _(msg`Change Password`),
      message: _(
        msg`If you want to change your password, we will send you a code to verify that this is your account.`,
      ),
    },
    ChangePassword: {
      title: _(msg`Enter Code`),
      message: _(msg`Enter the code you received to change your password.`),
    },
    Done: {
      title: _(msg`Password Changed`),
      message: _(msg`Your password has been changed successfully!`),
    },
  }

  const onRequestCode = async () => {
    if (
      !currentAccount?.email ||
      !EmailValidator.validate(currentAccount.email)
    ) {
      return setError(_(msg`Your email appears to be invalid.`))
    }

    setError('')
    setIsProcessing(true)
    try {
      await agent.com.atproto.server.requestPasswordReset({
        email: currentAccount.email,
      })
      setStage(Stages.ChangePassword)
    } catch (e: any) {
      logger.warn('Failed to request password reset', {error: e})
      if (isNetworkError(e)) {
        setError(
          _(
            msg`Unable to contact your service. Please check your Internet connection.`,
          ),
        )
      } else {
        setError(cleanError(e))
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const onChangePassword = async () => {
    const formattedCode = checkAndFormatResetCode(resetCode)
    if (!formattedCode) {
      setError(
        _(
          msg`You have entered an invalid code. It should look like XXXXX-XXXXX.`,
        ),
      )
      return
    }
    if (!newPassword) {
      setError(
        _(msg`Please enter a password. It must be at least 8 characters long.`),
      )
      return
    }
    if (newPassword.length < 8) {
      setError(_(msg`Password must be at least 8 characters long.`))
      return
    }

    setError('')
    setIsProcessing(true)
    try {
      await agent.com.atproto.server.resetPassword({
        token: formattedCode,
        password: newPassword,
      })
      setStage(Stages.Done)
    } catch (e: any) {
      logger.warn('Failed to set new password', {error: e})
      if (isNetworkError(e)) {
        setError(
          _(
            msg`Unable to contact your service. Please check your Internet connection.`,
          ),
        )
      } else {
        setError(cleanError(e))
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const onBlur = () => {
    const formattedCode = checkAndFormatResetCode(resetCode)
    if (!formattedCode) {
      return
    }
    setResetCode(formattedCode)
  }

  return (
    <Dialog.ScrollableInner
      label={_(msg`Change password dialog`)}
      style={web({maxWidth: 450})}>
      <Dialog.Close />
      <View style={[a.gap_xl]}>
        <View style={[a.gap_sm]}>
          <Text style={[a.font_heavy, a.text_2xl]}>
            {uiStrings[stage].title}
          </Text>
          {error ? (
            <View style={[a.rounded_sm, a.overflow_hidden]}>
              <ErrorMessage message={error} />
            </View>
          ) : null}

          <Text style={[a.text_md, a.leading_snug]}>
            {uiStrings[stage].message}
          </Text>
        </View>

        {stage === Stages.ChangePassword && (
          <View style={[a.gap_md]}>
            <View>
              <TextField.LabelText>
                <Trans>Confirmation Code</Trans>
              </TextField.LabelText>
              <TextField.Root>
                <TextField.Input
                  label={_(msg`Confirmation code`)}
                  placeholder="XXXXX-XXXXX"
                  value={resetCode}
                  onChangeText={setResetCode}
                  onBlur={onBlur}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="one-time-code"
                />
              </TextField.Root>
            </View>
            <View>
              <TextField.LabelText>
                <Trans>New Password</Trans>
              </TextField.LabelText>
              <TextField.Root>
                <TextField.Input
                  label={_(msg`New password`)}
                  placeholder={_(msg`At least 8 characters`)}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="new-password"
                />
              </TextField.Root>
            </View>
          </View>
        )}

        <View style={[a.gap_sm, gtMobile && [a.flex_row_reverse, a.ml_auto]]}>
          {stage === Stages.RequestCode ? (
            <>
              <Button
                label={_(msg`Request Code`)}
                variant="solid"
                color="primary"
                size="large"
                disabled={isProcessing}
                onPress={onRequestCode}>
                <ButtonText>
                  <Trans>Request Code</Trans>
                </ButtonText>
                {isProcessing && <ButtonIcon icon={Loader} />}
              </Button>
              {gtMobile ? (
                <Button
                  label={_(msg`Already have a code?`)}
                  onPress={() => setStage(Stages.ChangePassword)}
                  size="large"
                  color="primary"
                  variant="ghost"
                  disabled={isProcessing}>
                  <ButtonText>
                    <Trans>Already have a code?</Trans>
                  </ButtonText>
                </Button>
              ) : (
                <Button
                  label={_(msg`Cancel`)}
                  variant="solid"
                  color="secondary"
                  size="large"
                  disabled={isProcessing}
                  onPress={() => control.close()}>
                  <ButtonText>
                    <Trans>Cancel</Trans>
                  </ButtonText>
                </Button>
              )}
            </>
          ) : stage === Stages.ChangePassword ? (
            <>
              <Button
                label={_(msg`Change Password`)}
                variant="solid"
                color="primary"
                size="large"
                disabled={isProcessing}
                onPress={onChangePassword}>
                <ButtonText>
                  <Trans>Change Password</Trans>
                </ButtonText>
                {isProcessing && <ButtonIcon icon={Loader} />}
              </Button>
              <Button
                label={_(msg`Back`)}
                variant="solid"
                color="secondary"
                size="large"
                disabled={isProcessing}
                onPress={() => {
                  setResetCode('')
                  setStage(Stages.RequestCode)
                }}>
                <ButtonText>
                  <Trans>Back</Trans>
                </ButtonText>
              </Button>
            </>
          ) : stage === Stages.Done ? (
            <Button
              label={_(msg`Close`)}
              variant="solid"
              color="primary"
              size="large"
              onPress={() => control.close()}>
              <ButtonText>
                <Trans>Close</Trans>
              </ButtonText>
            </Button>
          ) : null}
        </View>
      </View>
    </Dialog.ScrollableInner>
  )
}
