import {useState} from 'react'
import {useWindowDimensions, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import * as EmailValidator from 'email-validator'

import {cleanError, isNetworkError} from '#/lib/strings/errors'
import {checkAndFormatResetCode} from '#/lib/strings/password'
import {logger} from '#/logger'
import {isNative} from '#/platform/detection'
import {useAgent, useSession} from '#/state/session'
import {ErrorMessage} from '#/view/com/util/error/ErrorMessage'
import {android, atoms as a, web} from '#/alf'
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
  const {height} = useWindowDimensions()

  return (
    <Dialog.Outer
      control={control}
      nativeOptions={android({minHeight: height / 2})}>
      <Dialog.Handle />
      <Inner />
    </Dialog.Outer>
  )
}

function Inner() {
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const agent = useAgent()
  const control = Dialog.useDialogContext()

  const [stage, setStage] = useState(Stages.RequestCode)
  const [isProcessing, setIsProcessing] = useState(false)
  const [resetCode, setResetCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')

  const uiStrings = {
    RequestCode: {
      title: _(msg`Change your password`),
      message: _(
        msg`If you want to change your password, we will send you a code to verify that this is your account.`,
      ),
    },
    ChangePassword: {
      title: _(msg`Enter code`),
      message: _(
        msg`Please enter the code you received and the new password you would like to use.`,
      ),
    },
    Done: {
      title: _(msg`Password changed`),
      message: _(
        msg`Your password has been changed successfully! Please use your new password when you sign in to Bluesky from now on.`,
      ),
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
      if (isNetworkError(e)) {
        setError(
          _(
            msg`Unable to contact your service. Please check your internet connection and try again.`,
          ),
        )
      } else {
        logger.error('Failed to request password reset', {safeMessage: e})
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
      if (isNetworkError(e)) {
        setError(
          _(
            msg`Unable to contact your service. Please check your internet connection and try again.`,
          ),
        )
      } else if (e?.toString().includes('Token is invalid')) {
        setError(_(msg`This confirmation code is not valid. Please try again.`))
      } else {
        logger.error('Failed to set new password', {safeMessage: e})
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
      style={web({maxWidth: 400})}>
      <View style={[a.gap_xl]}>
        <View style={[a.gap_sm]}>
          <Text style={[a.font_bold, a.text_2xl]}>
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
                <Trans>Confirmation code</Trans>
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
                <Trans>New password</Trans>
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

        <View style={[a.gap_sm]}>
          {stage === Stages.RequestCode ? (
            <>
              <Button
                label={_(msg`Request code`)}
                color="primary"
                size="large"
                disabled={isProcessing}
                onPress={onRequestCode}>
                <ButtonText>
                  <Trans>Request code</Trans>
                </ButtonText>
                {isProcessing && <ButtonIcon icon={Loader} />}
              </Button>
              <Button
                label={_(msg`Already have a code?`)}
                onPress={() => setStage(Stages.ChangePassword)}
                size="large"
                color="primary_subtle"
                disabled={isProcessing}>
                <ButtonText>
                  <Trans>Already have a code?</Trans>
                </ButtonText>
              </Button>
              {isNative && (
                <Button
                  label={_(msg`Cancel`)}
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
                label={_(msg`Change password`)}
                color="primary"
                size="large"
                disabled={isProcessing}
                onPress={onChangePassword}>
                <ButtonText>
                  <Trans>Change password</Trans>
                </ButtonText>
                {isProcessing && <ButtonIcon icon={Loader} />}
              </Button>
              <Button
                label={_(msg`Back`)}
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
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}
