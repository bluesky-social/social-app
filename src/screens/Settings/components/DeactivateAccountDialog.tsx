import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {logger} from '#/logger'
import {useAgent, useSessionApi} from '#/state/session'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {DialogOuterProps} from '#/components/Dialog'
import {Divider} from '#/components/Divider'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'
import {Loader} from '#/components/Loader'
import * as Prompt from '#/components/Prompt'
import {Text} from '#/components/Typography'

export function DeactivateAccountDialog({
  control,
}: {
  control: DialogOuterProps['control']
}) {
  return (
    <Prompt.Outer control={control}>
      <DeactivateAccountDialogInner control={control} />
    </Prompt.Outer>
  )
}

function DeactivateAccountDialogInner({
  control,
}: {
  control: DialogOuterProps['control']
}) {
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const {_} = useLingui()
  const agent = useAgent()
  const {logoutCurrentAccount} = useSessionApi()
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | undefined>()

  const handleDeactivate = React.useCallback(async () => {
    try {
      setPending(true)
      await agent.com.atproto.server.deactivateAccount({})
      control.close(() => {
        logoutCurrentAccount('Deactivated')
      })
    } catch (e: any) {
      switch (e.message) {
        case 'Bad token scope':
          setError(
            _(
              msg`You're signed in with an App Password. Please sign in with your main password to continue deactivating your account.`,
            ),
          )
          break
        default:
          setError(_(msg`Something went wrong, please try again`))
          break
      }

      logger.error(e, {
        message: 'Failed to deactivate account',
      })
    } finally {
      setPending(false)
    }
  }, [agent, control, logoutCurrentAccount, _, setPending])

  return (
    <>
      <Prompt.TitleText>{_(msg`Deactivate account`)}</Prompt.TitleText>
      <Prompt.DescriptionText>
        <Trans>
          Your profile, posts, feeds, and lists will no longer be visible to
          other Bluesky users. You can reactivate your account at any time by
          logging in.
        </Trans>
      </Prompt.DescriptionText>

      <View style={[a.pb_xl]}>
        <Divider />
        <View style={[a.gap_sm, a.pt_lg, a.pb_xl]}>
          <Text style={[t.atoms.text_contrast_medium, a.leading_snug]}>
            <Trans>
              There is no time limit for account deactivation, come back any
              time.
            </Trans>
          </Text>
          <Text style={[t.atoms.text_contrast_medium, a.leading_snug]}>
            <Trans>
              If you're trying to change your handle or email, do so before you
              deactivate.
            </Trans>
          </Text>
        </View>

        <Divider />
      </View>
      <Prompt.Actions>
        <Button
          variant="solid"
          color="negative"
          size={gtMobile ? 'small' : 'large'}
          label={_(msg`Yes, deactivate`)}
          onPress={handleDeactivate}>
          <ButtonText>{_(msg`Yes, deactivate`)}</ButtonText>
          {pending && <ButtonIcon icon={Loader} position="right" />}
        </Button>
        <Prompt.Cancel />
      </Prompt.Actions>

      {error && (
        <View
          style={[
            a.flex_row,
            a.gap_sm,
            a.mt_md,
            a.p_md,
            a.rounded_sm,
            t.atoms.bg_contrast_25,
          ]}>
          <CircleInfo size="md" fill={t.palette.negative_400} />
          <Text style={[a.flex_1, a.leading_snug]}>{error}</Text>
        </View>
      )}
    </>
  )
}
