import {useState} from 'react'
import {useWindowDimensions, View} from 'react-native'
import {useLingui} from '@lingui/react/macro'
import {Trans} from '@lingui/react/macro'
import * as EmailValidator from 'email-validator'

import {cleanError, isNetworkError} from '#/lib/strings/errors'
import {checkAndFormatResetCode} from '#/lib/strings/password'
import {logger} from '#/logger'
import {useAgent, useSession} from '#/state/session'
import {ErrorMessage} from '#/view/com/util/error/ErrorMessage'
import {android, atoms as a, web} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {IS_NATIVE} from '#/env'

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
  const {t: l} = useLingui()
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
      title: l`Change your password`,
      message: l`If you want to change your password, we will send you a code to verify that this is your account.`,
    },
    ChangePassword: {
      title: l`Enter code`,
      message: l`Please enter the code you received and the new password you would like to use.`,
    },
    Done: {
      title: l`Password changed`,
      message: l`Your password has been changed successfully! Please use your new password when you sign in to Bluesky from now on.`,
    },
  }

  const onRequestCode = async () => {
    if (
      !currentAccount?.email ||
      !EmailValidator.validate(currentAccount.email)
    ) {
      return setError(l`Your email appears to be invalid.`)
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
          l`Unable to contact your service. Please check your internet connection and try again.`,
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
        l`You have entered an invalid code. It should look like XXXXX-XXXXX.`,
      )
      return
    }
    if (!newPassword) {
      setError(
        l`Please enter a password. It must be at least 8 characters long.`,
      )
      return
    }
    if (newPassword.length < 8) {
      setError(l`Password must be at least 8 characters long.`)
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
          l`Unable to contact your service. Please check your internet connection and try again.`,
        )
      } else if (e?.toString().includes('Token is invalid')) {
        setError(l`This confirmation code is not valid. Please try again.`)
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
      label={l`Change password dialog`}
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
                  label={l`Confirmation code`}
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
                  label={l`New password`}
                  placeholder={l`At least 8 characters`}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="new-password"
                  passwordRules="minlength: 8;"
                />
              </TextField.Root>
            </View>
          </View>
        )}

        <View style={[a.gap_sm]}>
          {stage === Stages.RequestCode ? (
            <>
              <Button
                label={l`Request code`}
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
                label={l`Already have a code?`}
                onPress={() => setStage(Stages.ChangePassword)}
                size="large"
                color="primary_subtle"
                disabled={isProcessing}>
                <ButtonText>
                  <Trans>Already have a code?</Trans>
                </ButtonText>
              </Button>
              {IS_NATIVE && (
                <Button
                  label={l`Cancel`}
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
                label={l`Change password`}
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
                label={l`Back`}
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
              label={l`Close`}
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
