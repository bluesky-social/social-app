import {useState} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {cleanError} from '#/lib/strings/errors'
import {useAgent, useSession} from '#/state/session'
import {ErrorMessage} from '#/view/com/util/error/ErrorMessage'
import {atoms as a, useBreakpoints, web} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

export function ChangeEmailDialog({
  control,
  verifyEmailControl,
}: {
  control: Dialog.DialogControlProps
  verifyEmailControl: Dialog.DialogControlProps
}) {
  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <Inner verifyEmailControl={verifyEmailControl} />
    </Dialog.Outer>
  )
}

export function Inner({
  verifyEmailControl,
}: {
  verifyEmailControl: Dialog.DialogControlProps
}) {
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const agent = useAgent()
  const control = Dialog.useDialogContext()
  const {gtMobile} = useBreakpoints()

  const [currentStep, setCurrentStep] = useState<
    'StepOne' | 'StepTwo' | 'StepThree'
  >('StepOne')
  const [email, setEmail] = useState('')
  const [confirmationCode, setConfirmationCode] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')

  const currentEmail = currentAccount?.email || '(no email)'
  const uiStrings = {
    StepOne: {
      title: _(msg`Change Your Email`),
      message: '',
    },
    StepTwo: {
      title: _(msg`Security Step Required`),
      message: _(
        msg`An email has been sent to your previous address, ${currentEmail}. It includes a confirmation code which you can enter below.`,
      ),
    },
    StepThree: {
      title: _(msg`Email Updated!`),
      message: _(
        msg`Your email address has been updated but it is not yet verified. As a next step, please verify your new email.`,
      ),
    },
  }

  const onRequestChange = async () => {
    if (email === currentAccount?.email) {
      setError(
        _(
          msg`The email address you entered is the same as your current email address.`,
        ),
      )
      return
    }
    setError('')
    setIsProcessing(true)
    try {
      const res = await agent.com.atproto.server.requestEmailUpdate()
      if (res.data.tokenRequired) {
        setCurrentStep('StepTwo')
      } else {
        await agent.com.atproto.server.updateEmail({email: email.trim()})
        await agent.resumeSession(agent.session!)
        setCurrentStep('StepThree')
      }
    } catch (e) {
      setError(cleanError(String(e)))
    } finally {
      setIsProcessing(false)
    }
  }

  const onConfirm = async () => {
    setError('')
    setIsProcessing(true)
    try {
      await agent.com.atproto.server.updateEmail({
        email: email.trim(),
        token: confirmationCode.trim(),
      })
      await agent.resumeSession(agent.session!)
      setCurrentStep('StepThree')
    } catch (e) {
      setError(cleanError(String(e)))
    } finally {
      setIsProcessing(false)
    }
  }

  const onVerify = async () => {
    control.close(() => {
      verifyEmailControl.open()
    })
  }

  return (
    <Dialog.ScrollableInner
      label={_(msg`Verify email dialog`)}
      style={web({maxWidth: 450})}>
      <Dialog.Close />
      <View style={[a.gap_xl]}>
        <View style={[a.gap_sm]}>
          <Text style={[a.font_heavy, a.text_2xl]}>
            {uiStrings[currentStep].title}
          </Text>
          {error ? (
            <View style={[a.rounded_sm, a.overflow_hidden]}>
              <ErrorMessage message={error} />
            </View>
          ) : null}
          {currentStep === 'StepOne' ? (
            <View>
              <TextField.LabelText>
                <Trans>Enter your new email address below.</Trans>
              </TextField.LabelText>
              <TextField.Root>
                <TextField.Input
                  label={_(msg`New email address`)}
                  placeholder={_(msg`alice@example.com`)}
                  defaultValue={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoComplete="email"
                />
              </TextField.Root>
            </View>
          ) : (
            <Text style={[a.text_md, a.leading_snug]}>
              {uiStrings[currentStep].message}
            </Text>
          )}
        </View>
        {currentStep === 'StepTwo' ? (
          <View>
            <TextField.LabelText>
              <Trans>Confirmation code</Trans>
            </TextField.LabelText>
            <TextField.Root>
              <TextField.Input
                label={_(msg`Confirmation code`)}
                placeholder="XXXXX-XXXXX"
                onChangeText={setConfirmationCode}
              />
            </TextField.Root>
          </View>
        ) : null}
        <View style={[a.gap_sm, gtMobile && [a.flex_row_reverse, a.ml_auto]]}>
          {currentStep === 'StepOne' ? (
            <>
              <Button
                label={_(msg`Request change`)}
                variant="solid"
                color="primary"
                size="large"
                disabled={isProcessing}
                onPress={onRequestChange}>
                <ButtonText>
                  <Trans>Request change</Trans>
                </ButtonText>
                {isProcessing ? (
                  <Loader size="sm" style={[{color: 'white'}]} />
                ) : null}
              </Button>
              <Button
                label={_(msg`I have a code`)}
                variant="solid"
                color="secondary"
                size="large"
                disabled={isProcessing}
                onPress={() => setCurrentStep('StepTwo')}>
                <ButtonText>
                  <Trans>I have a code</Trans>
                </ButtonText>
              </Button>
            </>
          ) : currentStep === 'StepTwo' ? (
            <>
              <Button
                label={_(msg`Confirm`)}
                variant="solid"
                color="primary"
                size="large"
                disabled={isProcessing}
                onPress={onConfirm}>
                <ButtonText>
                  <Trans>Confirm</Trans>
                </ButtonText>
                {isProcessing ? (
                  <Loader size="sm" style={[{color: 'white'}]} />
                ) : null}
              </Button>
              <Button
                label={_(msg`Resend email`)}
                variant="solid"
                color="secondary"
                size="large"
                disabled={isProcessing}
                onPress={() => {
                  setConfirmationCode('')
                  setCurrentStep('StepOne')
                }}>
                <ButtonText>
                  <Trans>Resend email</Trans>
                </ButtonText>
              </Button>
            </>
          ) : currentStep === 'StepThree' ? (
            <>
              <Button
                label={_(msg`Verify email`)}
                variant="solid"
                color="primary"
                size="large"
                onPress={onVerify}>
                <ButtonText>
                  <Trans>Verify email</Trans>
                </ButtonText>
              </Button>
              <Button
                label={_(msg`Close`)}
                variant="solid"
                color="secondary"
                size="large"
                onPress={() => control.close()}>
                <ButtonText>
                  <Trans>Close</Trans>
                </ButtonText>
              </Button>
            </>
          ) : null}
        </View>
      </View>
    </Dialog.ScrollableInner>
  )
}
