import {useState} from 'react'
import {Text as RNText, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {DM_SERVICE_HEADERS} from '#/lib/constants'
import {cleanError} from '#/lib/strings/errors'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useAgent, useSession, useSessionApi} from '#/state/session'
import {ErrorMessage} from '#/view/com/util/error/ErrorMessage'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a, useBreakpoints, useTheme, web} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {resetToTab} from '#/Navigation'

enum Stages {
  SendEmail = 'SendEmail',
  DeleteAccount = 'DeleteAccount',
}

export function DeleteAccountDialog({
  control,
  deactivateDialogControl,
}: {
  control: Dialog.DialogControlProps
  deactivateDialogControl: Dialog.DialogControlProps
}) {
  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <Inner deactivateDialogControl={deactivateDialogControl} />
    </Dialog.Outer>
  )
}

function Inner({
  deactivateDialogControl,
}: {
  deactivateDialogControl: Dialog.DialogControlProps
}) {
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const {removeAccount} = useSessionApi()
  const agent = useAgent()
  const control = Dialog.useDialogContext()
  const t = useTheme()
  const {gtMobile} = useBreakpoints()

  const [stage, setStage] = useState(Stages.SendEmail)
  const [isProcessing, setIsProcessing] = useState(false)
  const [confirmCode, setConfirmCode] = useState('')
  const [password, setPassword] = useState('')
  const [handleInput, setHandleInput] = useState('')
  const [error, setError] = useState('')

  const onPressSendEmail = async () => {
    setError('')
    setIsProcessing(true)
    try {
      await agent.com.atproto.server.requestAccountDelete()
      setStage(Stages.DeleteAccount)
    } catch (e: any) {
      setError(cleanError(e))
    }
    setIsProcessing(false)
  }

  const onPressConfirmDelete = async () => {
    if (!currentAccount?.did) {
      throw new Error('DeleteAccount modal: currentAccount.did is undefined')
    }

    if (!confirmCode) {
      setError(_(msg`Please enter the confirmation code sent to your email.`))
      return
    }

    if (!password) {
      setError(_(msg`Please enter your password to confirm.`))
      return
    }

    // Remove any @ symbol at the beginning and trim whitespace
    const cleanedHandle = handleInput.replace(/^@/, '').trim()

    if (!cleanedHandle) {
      setError(_(msg`Please enter your handle to confirm deletion.`))
      return
    }

    if (cleanedHandle.toLowerCase() !== currentAccount.handle.toLowerCase()) {
      setError(_(msg`Handle doesn't match. Please enter your exact handle.`))
      return
    }

    setError('')
    setIsProcessing(true)
    const token = confirmCode.replace(/\s/g, '')

    try {
      // inform chat service of intent to delete account
      const {success} = await agent.chat.bsky.actor.deleteAccount(undefined, {
        headers: DM_SERVICE_HEADERS,
      })
      if (!success) {
        throw new Error('Failed to inform chat service of account deletion')
      }
      await agent.com.atproto.server.deleteAccount({
        did: currentAccount.did,
        password,
        token,
      })
      control.close(() => {
        Toast.show(_(msg`Your account has been deleted`))
        resetToTab('HomeTab')
        removeAccount(currentAccount)
      })
    } catch (e: any) {
      setError(cleanError(e))
    }
    setIsProcessing(false)
  }

  const title =
    stage === Stages.SendEmail
      ? currentAccount
        ? _(msg`Delete account "${sanitizeHandle(currentAccount?.handle)}"`)
        : _(msg`Delete account`)
      : _(msg`Confirm deletion`)

  return (
    <Dialog.ScrollableInner
      label={_(msg`Delete account dialog`)}
      style={web({maxWidth: 450})}>
      <View style={[a.gap_xl]}>
        <View style={[a.gap_sm]}>
          <Text style={[a.font_bold, a.text_2xl]}>{title}</Text>

          {error ? (
            <View style={[a.rounded_sm, a.overflow_hidden]}>
              <ErrorMessage message={error} />
            </View>
          ) : null}

          <Text style={[a.text_md, a.leading_snug]}>
            {stage === Stages.SendEmail ? (
              <Trans>
                For security reasons, we'll need to send a confirmation code to
                your email address.
              </Trans>
            ) : (
              <Trans>
                Check your inbox for an email with the confirmation code to
                enter below:
              </Trans>
            )}
          </Text>
        </View>

        {stage === Stages.SendEmail && (
          <Admonition>
            <Trans>
              You can also{' '}
              <RNText
                style={[{color: t.palette.primary_500}, web(a.underline)]}
                onPress={() =>
                  control.close(() => deactivateDialogControl.open())
                }>
                temporarily deactivate
              </RNText>{' '}
              your account instead, and reactivate it at any time.
            </Trans>
          </Admonition>
        )}

        {stage === Stages.DeleteAccount && (
          <View style={[a.gap_md]}>
            <View>
              <TextField.LabelText>
                <Trans>Confirmation code</Trans>
              </TextField.LabelText>
              <TextField.Root>
                <TextField.Input
                  label={_(msg`Confirmation code`)}
                  placeholder={_(msg`Enter code from email`)}
                  value={confirmCode}
                  onChangeText={setConfirmCode}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="one-time-code"
                />
              </TextField.Root>
            </View>
            <View>
              <TextField.LabelText>
                <Trans>Password</Trans>
              </TextField.LabelText>
              <TextField.Root>
                <TextField.Input
                  label={_(msg`Password`)}
                  placeholder={_(msg`Enter your password`)}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="password"
                />
              </TextField.Root>
            </View>
            <View>
              <TextField.LabelText>
                <Trans>Handle of the account you want to delete</Trans>
              </TextField.LabelText>
              <TextField.Root>
                <TextField.Input
                  label={_(msg`Your handle`)}
                  placeholder={currentAccount?.handle}
                  value={handleInput}
                  onChangeText={setHandleInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </TextField.Root>
            </View>
          </View>
        )}

        <View style={[a.gap_sm, gtMobile && [a.flex_row_reverse, a.ml_auto]]}>
          {stage === Stages.SendEmail ? (
            <>
              <Button
                label={_(msg`Send Email`)}
                color="negative"
                size="large"
                disabled={isProcessing}
                onPress={onPressSendEmail}>
                <ButtonText>
                  <Trans>Send email</Trans>
                </ButtonText>
                {isProcessing && <ButtonIcon icon={Loader} />}
              </Button>
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
            </>
          ) : stage === Stages.DeleteAccount ? (
            <>
              <Button
                label={_(msg`Delete account`)}
                color="negative"
                size="large"
                disabled={isProcessing}
                onPress={onPressConfirmDelete}>
                <ButtonText>
                  <Trans>Delete Account</Trans>
                </ButtonText>
                {isProcessing && <ButtonIcon icon={Loader} />}
              </Button>
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
            </>
          ) : null}
        </View>
      </View>
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}
