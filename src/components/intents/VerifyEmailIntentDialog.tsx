import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useAgent, useSession} from 'state/session'
import {atoms as a} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {DialogControlProps} from '#/components/Dialog'
import {useIntentDialogs} from '#/components/intents/IntentDialogs'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

export function VerifyEmailIntentDialog() {
  const {verifyEmailDialogControl: control} = useIntentDialogs()

  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <Inner control={control} />
    </Dialog.Outer>
  )
}

function Inner({control}: {control: DialogControlProps}) {
  const {_} = useLingui()
  const {verifyEmailState: state} = useIntentDialogs()
  const [status, setStatus] = React.useState<
    'loading' | 'success' | 'failure' | 'resent'
  >('loading')
  const [sending, setSending] = React.useState(false)
  const agent = useAgent()
  const {currentAccount} = useSession()

  React.useEffect(() => {
    ;(async () => {
      if (!state?.code) {
        return
      }
      try {
        await agent.com.atproto.server.confirmEmail({
          email: (currentAccount?.email || '').trim(),
          token: state.code.trim(),
        })
        setStatus('success')
      } catch (e) {
        setStatus('failure')
      }
    })()
  }, [agent.com.atproto.server, currentAccount?.email, state?.code])

  const onPressResendEmail = async () => {
    setSending(true)
    await agent.com.atproto.server.requestEmailConfirmation()
    setSending(false)
    setStatus('resent')
  }

  return (
    <Dialog.ScrollableInner label={_(msg`Verify email dialog`)}>
      <Dialog.Close />
      <View style={[a.gap_xl]}>
        {status === 'loading' ? (
          <View style={[a.py_2xl, a.align_center, a.justify_center]}>
            <Loader size="xl" />
          </View>
        ) : status === 'success' ? (
          <>
            <Text style={[a.font_bold, a.text_2xl]}>
              <Trans>Email Verified</Trans>
            </Text>
            <Text style={[a.text_md, a.leading_tight]}>
              <Trans>
                Thanks, you have successfully verified your email address.
              </Trans>
            </Text>
          </>
        ) : status === 'failure' ? (
          <>
            <Text style={[a.font_bold, a.text_2xl]}>
              <Trans>Invalid Verification Code</Trans>
            </Text>
            <Text style={[a.text_md, a.leading_tight]}>
              <Trans>
                The verification code you have provided is invalid. Please make
                sure that you have used the correct verification link or request
                a new one.
              </Trans>
            </Text>
          </>
        ) : (
          <>
            <Text style={[a.font_bold, a.text_2xl]}>
              <Trans>Email Resent</Trans>
            </Text>
            <Text style={[a.text_md, a.leading_tight]}>
              <Trans>
                We have sent another verification email to{' '}
                <Text style={[a.text_md, a.font_bold]}>
                  {currentAccount?.email}
                </Text>
                .
              </Trans>
            </Text>
          </>
        )}
        {status !== 'loading' ? (
          <View style={[a.w_full, a.flex_row, a.gap_sm, {marginLeft: 'auto'}]}>
            <Button
              label={_(msg`Close`)}
              onPress={() => control.close()}
              variant="solid"
              color={status === 'failure' ? 'secondary' : 'primary'}
              size="medium"
              style={{marginLeft: 'auto'}}>
              <ButtonText>
                <Trans>Close</Trans>
              </ButtonText>
            </Button>
            {status === 'failure' ? (
              <Button
                label={_(msg`Resend Verification Email`)}
                onPress={onPressResendEmail}
                variant="solid"
                color="primary"
                size="medium"
                disabled={sending}>
                <ButtonText>
                  <Trans>Resend Email</Trans>
                </ButtonText>
                {sending ? <Loader size="sm" style={{color: 'white'}} /> : null}
              </Button>
            ) : null}
          </View>
        ) : null}
      </View>
    </Dialog.ScrollableInner>
  )
}
