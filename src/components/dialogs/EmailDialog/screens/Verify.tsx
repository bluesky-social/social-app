import {useState} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {wait} from '#/lib/async/wait'
import {logger} from '#/logger'
import {useSession} from '#/state/session'
import {atoms as a, useTheme} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {ResendEmailText} from '#/components/dialogs/EmailDialog/components/ResendEmailText'
import {TokenField} from '#/components/dialogs/EmailDialog/components/TokenField'
import {useConfirmEmail} from '#/components/dialogs/EmailDialog/data/useConfirmEmail'
import {useIsEmailVerified} from '#/components/dialogs/EmailDialog/data/useIsEmailVerified'
import {useRequestEmailVerification} from '#/components/dialogs/EmailDialog/data/useRequestEmailVerification'
import {type Screen} from '#/components/dialogs/EmailDialog/types'
import {Divider} from '#/components/Divider'
import {CheckThick_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {Envelope_Stroke2_Corner0_Rounded as Envelope} from '#/components/icons/Envelope'
import {createStaticClick, InlineLinkText} from '#/components/Link'
import {Loader} from '#/components/Loader'
import {Span, Text} from '#/components/Typography'

export function Verify({config}: {config: Extract<Screen, {id: 'Verify'}>}) {
  const t = useTheme()
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const [error, setError] = useState('')

  const [step, setStep] = useState<
    'default' | 'sent' | 'token' | 'tokenConfirmed'
  >('default')
  const [sendingStatus, setSendingStatus] = useState<'sending' | null>(null)
  const {mutateAsync: requestEmailVerification} = useRequestEmailVerification()

  const [token, setToken] = useState('')
  const [confirmingStatus, setConfirmingStatus] = useState<'sending' | null>(
    null,
  )
  const {mutateAsync: confirmEmail} = useConfirmEmail()

  useIsEmailVerified({
    onEmailVerified: () => {
      config.onVerify?.()
    },
  })

  const handleRequestEmailVerification = async () => {
    setError('')
    setSendingStatus('sending')

    try {
      await wait(1000, requestEmailVerification())
      setStep('sent')
    } catch (e) {
      logger.error('EmailDialog: sending verification email failed', {
        safeMessage: e,
      })
      setError(_(msg`Failed to send email, please try again.`))
    } finally {
      setSendingStatus(null)
    }
  }

  const handleConfirmEmail = async () => {
    setError('')
    setConfirmingStatus('sending')

    try {
      await wait(1000, confirmEmail({token}))
      setStep('tokenConfirmed')
    } catch (e) {
      logger.error('EmailDialog: confirming email failed', {
        safeMessage: e,
      })
      setError(_(msg`Failed to verify email, please try again.`))
    } finally {
      setConfirmingStatus(null)
    }
  }

  return (
    <View style={[a.gap_lg]}>
      <View style={[a.gap_sm]}>
        <Text style={[a.text_xl, a.font_heavy]}>
          {step === 'sent' ? (
            <>
              <Span style={{top: 1}}>
                <Check size="sm" fill={t.palette.positive_500} />
              </Span>{' '}
              <Trans>Email sent!</Trans>
            </>
          ) : step === 'tokenConfirmed' ? (
            <>
              <Span style={{top: 1}}>
                <Check size="sm" fill={t.palette.positive_500} />
              </Span>{' '}
              <Trans>Email verification complete</Trans>
            </>
          ) : (
            <Trans>Verify email</Trans>
          )}
        </Text>

        {step === 'default' && (
          <>
            {config.instructions?.map((int, i) => (
              <Text
                key={i}
                style={[
                  a.text_sm,
                  a.leading_snug,
                  t.atoms.text_contrast_medium,
                ]}>
                {int}
              </Text>
            ))}
          </>
        )}

        <Text style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
          {step === 'sent' ? (
            <Trans>
              We sent an email to{' '}
              <Span style={[a.font_bold, t.atoms.text]}>
                {currentAccount!.email}
              </Span>{' '}
              containing a link. Click on it to complete the email verification
              process.
            </Trans>
          ) : step === 'token' ? (
            <Trans>
              Enter the code we sent to{' '}
              <Span style={[a.font_bold, t.atoms.text]}>
                {currentAccount!.email}
              </Span>{' '}
              below.
            </Trans>
          ) : step === 'tokenConfirmed' ? (
            <Trans>
              You have successfully verified your email address. You can close
              this dialog.
            </Trans>
          ) : (
            <Trans>
              We'll send you an email to{' '}
              <Span style={[a.font_bold, t.atoms.text]}>
                {currentAccount!.email}
              </Span>{' '}
              containing a link. Click on it to complete the email verification
              process.
            </Trans>
          )}
        </Text>

        {step === 'sent' && (
          <ResendEmailText onPress={requestEmailVerification} />
        )}
      </View>

      {step === 'sent' && (
        <>
          <Divider />

          <Text
            style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
            <Trans>
              Have a code?{' '}
              <InlineLinkText
                label={_(msg`Enter code`)}
                {...createStaticClick(() => {
                  setStep('token')
                })}>
                Click here.
              </InlineLinkText>
            </Trans>
          </Text>
        </>
      )}

      {step === 'default' ? (
        <>
          {error && <Admonition type="error"> {error} </Admonition>}

          <Button
            label={_(msg`Send verification email`)}
            size="large"
            variant="solid"
            color="primary"
            onPress={handleRequestEmailVerification}
            disabled={sendingStatus === 'sending'}>
            <ButtonText>
              <Trans>Send email</Trans>
            </ButtonText>
            <ButtonIcon
              icon={sendingStatus === 'sending' ? Loader : Envelope}
            />
          </Button>

          {!config.hideInitialCodeButton && (
            <>
              <Divider />

              <Text
                style={[
                  a.text_sm,
                  a.leading_snug,
                  t.atoms.text_contrast_medium,
                ]}>
                <Trans>
                  Have a code?{' '}
                  <InlineLinkText
                    label={_(msg`Enter code`)}
                    {...createStaticClick(() => {
                      setStep('token')
                    })}>
                    Click here.
                  </InlineLinkText>
                </Trans>
              </Text>
            </>
          )}
        </>
      ) : step === 'token' ? (
        <>
          <TokenField
            value={token}
            onChangeText={setToken}
            onSubmitEditing={() => {}}
          />

          {error && <Admonition type="error"> {error} </Admonition>}

          <Button
            label={_(msg`Verify`)}
            size="large"
            variant="solid"
            color="primary"
            onPress={handleConfirmEmail}
            disabled={!token || confirmingStatus === 'sending'}>
            <ButtonText>
              <Trans>Verify code</Trans>
            </ButtonText>
            {confirmingStatus === 'sending' && <ButtonIcon icon={Loader} />}
          </Button>
        </>
      ) : null}
    </View>
  )
}
