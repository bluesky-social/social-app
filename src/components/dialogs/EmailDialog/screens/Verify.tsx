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
import {useRequestEmailVerification} from '#/components/dialogs/EmailDialog/data/useRequestEmailVerification'
import {type Screen} from '#/components/dialogs/EmailDialog/types'
import {Divider} from '#/components/Divider'
import {CheckThick_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {Envelope_Stroke2_Corner0_Rounded as Envelope} from '#/components/icons/Envelope'
import {createStaticClick, InlineLinkText} from '#/components/Link'
import {Loader} from '#/components/Loader'
import {Span, Text} from '#/components/Typography'

export function Verify(_props: {config: Exclude<Screen, {id: 'Update'}>}) {
  const t = useTheme()
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const [error, setError] = useState('')

  const [sentEmail, setSentEmail] = useState(false)
  const [sendingStatus, setSendingStatus] = useState<'sending' | null>(null)
  const {mutateAsync: requestEmailVerification} = useRequestEmailVerification()

  const handleRequestEmailVerification = async () => {
    setError('')
    setSendingStatus('sending')

    try {
      await wait(1000, requestEmailVerification())
      setSentEmail(true)
    } catch (e) {
      logger.error('EmailDialog: sending verification email failed', {
        safeMessage: e,
      })
      setError(_(msg`Failed to send email, please try again.`))
    } finally {
      setSendingStatus(null)
    }
  }

  return (
    <View style={[a.gap_lg]}>
      <View style={[a.gap_sm]}>
        <Text style={[a.text_xl, a.font_heavy]}>
          {sentEmail ? (
            <>
              <Span style={{top: 1}}>
                <Check size="sm" fill={t.palette.positive_500} />
              </Span>{' '}
              <Trans>Email sent!</Trans>
            </>
          ) : (
            <Trans>Verify email</Trans>
          )}
        </Text>

        <Text style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
          {sentEmail ? (
            <Trans>
              We sent an email to{' '}
              <Span style={[a.font_bold, t.atoms.text]}>
                {currentAccount!.email}
              </Span>{' '}
              containing a link. Click on it to complete the email verification
              process.
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

        {sentEmail && <ResendEmailText onPress={requestEmailVerification} />}
      </View>

      {!sentEmail && (
        <>
          {error && <Admonition type="error"> {error} </Admonition>}

          <Button
            label={_(msg`Send verification email`)}
            size="large"
            variant="solid"
            color={'primary'}
            onPress={handleRequestEmailVerification}
            disabled={sendingStatus === 'sending'}>
            <ButtonText>
              <Trans>Send email</Trans>
            </ButtonText>
            <ButtonIcon
              icon={sendingStatus === 'sending' ? Loader : Envelope}
            />
          </Button>

          <Divider />

          <Text
            style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
            <Trans>
              Have a code?{' '}
              <InlineLinkText
                label={_(msg`Enter code`)}
                {...createStaticClick(() => {})}>
                Click here.
              </InlineLinkText>
            </Trans>
          </Text>
        </>
      )}
    </View>
  )
}
