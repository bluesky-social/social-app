import {useEffect, useState} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useAgent, useSession} from '#/state/session'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {type DialogControlProps} from '#/components/Dialog'
import {useConfirmEmail} from '#/components/dialogs/EmailDialog/data/useConfirmEmail'
import {Divider} from '#/components/Divider'
import {ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as Resend} from '#/components/icons/ArrowRotate'
import {useIntentDialogs} from '#/components/intents/IntentDialogs'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {IS_NATIVE} from '#/env'

export function VerifyEmailIntentDialog() {
  const {verifyEmailDialogControl: control} = useIntentDialogs()

  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <Inner control={control} />
    </Dialog.Outer>
  )
}

function Inner({}: {control: DialogControlProps}) {
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const {_} = useLingui()
  const {verifyEmailState: state} = useIntentDialogs()
  const [status, setStatus] = useState<
    'loading' | 'success' | 'failure' | 'resent'
  >('loading')
  const [sending, setSending] = useState(false)
  const agent = useAgent()
  const {currentAccount} = useSession()
  const {mutate: confirmEmail} = useConfirmEmail({
    onSuccess: () => setStatus('success'),
    onError: () => setStatus('failure'),
  })

  useEffect(() => {
    if (state?.code) {
      confirmEmail({token: state.code})
    }
  }, [state?.code, confirmEmail])

  const onPressResendEmail = async () => {
    setSending(true)
    await agent.com.atproto.server.requestEmailConfirmation()
    setSending(false)
    setStatus('resent')
  }

  return (
    <Dialog.ScrollableInner
      label={_(msg`Verify email dialog`)}
      style={[
        gtMobile ? {width: 'auto', maxWidth: 400, minWidth: 200} : a.w_full,
      ]}>
      <View style={[a.gap_xl]}>
        {status === 'loading' ? (
          <View style={[a.py_2xl, a.align_center, a.justify_center]}>
            <Loader size="xl" fill={t.atoms.text_contrast_low.color} />
          </View>
        ) : status === 'success' ? (
          <View style={[a.gap_sm, IS_NATIVE && a.pb_xl]}>
            <Text style={[a.font_bold, a.text_2xl]}>
              <Trans>Email Verified</Trans>
            </Text>
            <Text style={[a.text_md, a.leading_snug]}>
              <Trans>
                Thanks, you have successfully verified your email address. You
                can close this dialog.
              </Trans>
            </Text>
          </View>
        ) : status === 'failure' ? (
          <View style={[a.gap_sm]}>
            <Text style={[a.font_bold, a.text_2xl]}>
              <Trans>Invalid Verification Code</Trans>
            </Text>
            <Text style={[a.text_md, a.leading_snug]}>
              <Trans>
                The verification code you have provided is invalid. Please make
                sure that you have used the correct verification link or request
                a new one.
              </Trans>
            </Text>
          </View>
        ) : (
          <View style={[a.gap_sm, IS_NATIVE && a.pb_xl]}>
            <Text style={[a.font_bold, a.text_2xl]}>
              <Trans>Email Resent</Trans>
            </Text>
            <Text style={[a.text_md, a.leading_snug]}>
              <Trans>
                We have sent another verification email to{' '}
                <Text style={[a.text_md, a.font_semi_bold]}>
                  {currentAccount?.email}
                </Text>
                .
              </Trans>
            </Text>
          </View>
        )}

        {status === 'failure' && (
          <>
            <Divider />
            <Button
              label={_(msg`Resend Verification Email`)}
              onPress={onPressResendEmail}
              color="secondary_inverted"
              size="large"
              disabled={sending}>
              <ButtonIcon icon={sending ? Loader : Resend} />
              <ButtonText>
                <Trans>Resend Email</Trans>
              </ButtonText>
            </Button>
          </>
        )}
      </View>

      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}
