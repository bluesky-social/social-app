import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {cleanError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {useModalControls} from '#/state/modals'
import {useAgent, useSession} from '#/state/session'
import {ErrorMessage} from '#/view/com/util/error/ErrorMessage'
import {atoms as a, useBreakpoints} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {InlineLinkText} from '#/components/Link'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

export function VerifyEmailDialog({
  control,
  onCloseWithoutVerifying,
  onCloseAfterVerifying,
  reasonText,
}: {
  control: Dialog.DialogControlProps
  onCloseWithoutVerifying?: () => void
  onCloseAfterVerifying?: () => void
  reasonText?: string
}) {
  const agent = useAgent()

  const [didVerify, setDidVerify] = React.useState(false)

  return (
    <Dialog.Outer
      control={control}
      onClose={async () => {
        if (!didVerify) {
          onCloseWithoutVerifying?.()
          return
        }

        try {
          await agent.resumeSession(agent.session!)
          onCloseAfterVerifying?.()
        } catch (e: unknown) {
          logger.error(String(e))
          return
        }
      }}>
      <Dialog.Handle />
      <Inner
        control={control}
        setDidVerify={setDidVerify}
        reasonText={reasonText}
      />
    </Dialog.Outer>
  )
}

export function Inner({
  control,
  setDidVerify,
  reasonText,
}: {
  control: Dialog.DialogControlProps
  setDidVerify: (value: boolean) => void
  reasonText?: string
}) {
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const agent = useAgent()
  const {openModal} = useModalControls()
  const {gtMobile} = useBreakpoints()

  const [currentStep, setCurrentStep] = React.useState<
    'StepOne' | 'StepTwo' | 'StepThree'
  >('StepOne')
  const [confirmationCode, setConfirmationCode] = React.useState('')
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [error, setError] = React.useState('')

  const uiStrings = {
    StepOne: {
      title: _(msg`Verify Your Email`),
      message: '',
    },
    StepTwo: {
      title: _(msg`Enter Code`),
      message: _(
        msg`An email has been sent! Please enter the confirmation code included in the email below.`,
      ),
    },
    StepThree: {
      title: _(msg`Success!`),
      message: _(msg`Thank you! Your email has been successfully verified.`),
    },
  }

  const onSendEmail = async () => {
    setError('')
    setIsProcessing(true)
    try {
      await agent.com.atproto.server.requestEmailConfirmation()
      setCurrentStep('StepTwo')
    } catch (e: unknown) {
      setError(cleanError(e))
    } finally {
      setIsProcessing(false)
    }
  }

  const onVerifyEmail = async () => {
    setError('')
    setIsProcessing(true)
    try {
      await agent.com.atproto.server.confirmEmail({
        email: (currentAccount?.email || '').trim(),
        token: confirmationCode.trim(),
      })
    } catch (e: unknown) {
      setError(cleanError(String(e)))
      setIsProcessing(false)
      return
    }

    setIsProcessing(false)
    setDidVerify(true)
    setCurrentStep('StepThree')
  }

  return (
    <Dialog.ScrollableInner
      label={_(msg`Verify email dialog`)}
      style={[
        gtMobile ? {width: 'auto', maxWidth: 400, minWidth: 200} : a.w_full,
      ]}>
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
          <Text style={[a.text_md, a.leading_snug]}>
            {currentStep === 'StepOne' ? (
              <>
                {!reasonText ? (
                  <>
                    <Trans>
                      You'll receive an email at{' '}
                      <Text style={[a.text_md, a.leading_snug, a.font_bold]}>
                        {currentAccount?.email}
                      </Text>{' '}
                      to verify it's you.
                    </Trans>{' '}
                    <InlineLinkText
                      to="#"
                      label={_(msg`Change email address`)}
                      style={[a.text_md, a.leading_snug]}
                      onPress={e => {
                        e.preventDefault()
                        control.close(() => {
                          openModal({name: 'change-email'})
                        })
                        return false
                      }}>
                      <Trans>Need to change it?</Trans>
                    </InlineLinkText>
                  </>
                ) : (
                  reasonText
                )}
              </>
            ) : (
              uiStrings[currentStep].message
            )}
          </Text>
        </View>
        {currentStep === 'StepTwo' ? (
          <View>
            <TextField.LabelText>
              <Trans>Confirmation Code</Trans>
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
                label={_(msg`Send confirmation email`)}
                variant="solid"
                color="primary"
                size="large"
                disabled={isProcessing}
                onPress={onSendEmail}>
                <ButtonText>
                  <Trans>Send Confirmation</Trans>
                </ButtonText>
                {isProcessing ? (
                  <Loader size="sm" style={[{color: 'white'}]} />
                ) : null}
              </Button>
              <Button
                label={_(msg`I Have a Code`)}
                variant="solid"
                color="secondary"
                size="large"
                disabled={isProcessing}
                onPress={() => setCurrentStep('StepTwo')}>
                <ButtonText>
                  <Trans>I Have a Code</Trans>
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
                onPress={onVerifyEmail}>
                <ButtonText>
                  <Trans>Confirm</Trans>
                </ButtonText>
                {isProcessing ? (
                  <Loader size="sm" style={[{color: 'white'}]} />
                ) : null}
              </Button>
              <Button
                label={_(msg`Resend Email`)}
                variant="solid"
                color="secondary"
                size="large"
                disabled={isProcessing}
                onPress={() => {
                  setConfirmationCode('')
                  setCurrentStep('StepOne')
                }}>
                <ButtonText>
                  <Trans>Resend Email</Trans>
                </ButtonText>
              </Button>
            </>
          ) : currentStep === 'StepThree' ? (
            <Button
              label={_(msg`Confirm`)}
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
