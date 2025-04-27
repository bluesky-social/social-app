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
import {useRequestEmailUpdate} from '#/components/dialogs/EmailDialog/data/useRequestEmailUpdate'
import {useRequestEmailVerification} from '#/components/dialogs/EmailDialog/data/useRequestEmailVerification'
import {useUpdateEmail} from '#/components/dialogs/EmailDialog/data/useUpdateEmail'
import {type Screen} from '#/components/dialogs/EmailDialog/types'
import {Divider} from '#/components/Divider'
import * as TextField from '#/components/forms/TextField'
import {At_Stroke2_Corner0_Rounded as At} from '#/components/icons/At'
import {CheckThick_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

export function Update(_props: {config: Exclude<Screen, {id: 'Verify'}>}) {
  const t = useTheme()
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [tip, setTip] = useState('')
  const [success, setSuccess] = useState(false)
  const [tokenRequired, setTokenRequired] = useState(false)

  const [updateStatus, setUpdateStatus] = useState<'sending' | null>(null)
  const {mutateAsync: updateEmail} = useUpdateEmail()
  const {mutateAsync: requestEmailUpdate} = useRequestEmailUpdate()
  const {mutateAsync: requestEmailVerification} = useRequestEmailVerification()

  const handleEmailChange = (email: string) => {
    setEmail(email)

    // reset if email is edited
    if (tokenRequired) {
      setToken('')
      setTokenRequired(false)
    }
  }

  const handleUpdateEmail = async () => {
    setError('')
    setTip('')
    setUpdateStatus('sending')

    if (email === currentAccount!.email) {
      setTip(_(msg`This email is already associated with your account.`))
      setUpdateStatus(null)
      return
    }

    try {
      const {status} = await wait(
        1000,
        updateEmail({
          email,
          token,
        }),
      )

      if (status === 'tokenRequired') {
        setTokenRequired(true)
      } else if (status === 'success') {
        setSuccess(true)

        try {
          // fire off a confirmation email immediately
          await requestEmailVerification()
        } catch {}
      }
    } catch (e) {
      logger.error('EmailDialog: update email failed', {safeMessage: e})
      setError(_(msg`Email updated failed, please try again.`))
    } finally {
      setUpdateStatus(null)
    }
  }

  return (
    <View style={[a.gap_lg]}>
      <Text style={[a.text_xl, a.font_heavy]}>
        <Trans>Update email</Trans>
      </Text>

      <View style={[a.gap_md]}>
        <View>
          <Text style={[a.pb_sm, t.atoms.text_contrast_medium]}>
            <Trans>Enter your new email address below.</Trans>
          </Text>
          <TextField.Root>
            <TextField.Icon icon={At} />
            <TextField.Input
              label={_(msg`New email address`)}
              placeholder={_(msg`alice@example.com`)}
              defaultValue={email}
              onChangeText={success ? undefined : handleEmailChange}
              keyboardType="email-address"
              autoComplete="email"
              onSubmitEditing={handleUpdateEmail}
            />
          </TextField.Root>
        </View>

        {tokenRequired && (
          <>
            <Divider />
            <View>
              <Text style={[a.text_md, a.pb_sm, a.font_bold]}>
                <Trans>Security step required</Trans>
              </Text>
              <Text style={[a.pb_sm, t.atoms.text_contrast_medium]}>
                <Trans>Check your email for a security code.</Trans>
              </Text>
              <TokenField
                value={token}
                onChangeText={success ? undefined : setToken}
                onSubmitEditing={handleUpdateEmail}
              />
              {!success && (
                <ResendEmailText
                  onPress={requestEmailUpdate}
                  style={[a.pt_sm]}
                />
              )}
            </View>
          </>
        )}

        {error && <Admonition type="error">{error}</Admonition>}

        {tip && <Admonition type="tip">{tip}</Admonition>}
      </View>

      {success ? (
        <>
          <Divider />
          <View style={[a.gap_sm]}>
            <View style={[a.flex_row, a.gap_sm, a.align_center]}>
              <Check fill={t.palette.positive_500} size="xs" />
              <Text style={[a.text_md, a.font_heavy]}>
                <Trans>Success!</Trans>
              </Text>
            </View>
            <Text style={[a.leading_snug]}>
              <Trans>
                Click on the link in the email we just sent you to verify your
                email.
              </Trans>
            </Text>
          </View>
        </>
      ) : (
        <Button
          label={_(msg`Update email`)}
          size="large"
          variant="solid"
          color={success ? 'secondary' : 'primary'}
          onPress={handleUpdateEmail}
          disabled={
            !email ||
            (tokenRequired && !token) ||
            updateStatus === 'sending' ||
            success
          }>
          <ButtonText>
            <Trans>Update email</Trans>
          </ButtonText>
          {updateStatus === 'sending' && <ButtonIcon icon={Loader} />}
        </Button>
      )}
    </View>
  )
}
