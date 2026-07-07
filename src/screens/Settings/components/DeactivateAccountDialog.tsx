import {useCallback, useState} from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {gateDeactivateAccount} from '#/lib/api/gatekeeper'
import {useBrand} from '#/lib/community/BrandContext'
import {useIsBlackskyPds} from '#/lib/hooks/useIsBlackskyPds'
import {logger} from '#/logger'
import {useAgent, useSession, useSessionApi} from '#/state/session'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {type DialogOuterProps} from '#/components/Dialog'
import {Divider} from '#/components/Divider'
import * as TextField from '#/components/forms/TextField'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'
import {Lock_Stroke2_Corner2_Rounded as Lock} from '#/components/icons/Lock'
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
  const {_} = useLingui()
  const brand = useBrand()
  const agent = useAgent()
  const {currentAccount} = useSession()
  const {logoutCurrentAccount} = useSessionApi()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [password, setPassword] = useState('')

  const isOauth = currentAccount?.isOauthSession === true
  const isBskyPds = useIsBlackskyPds()
  const useGatekeeper = isOauth && isBskyPds

  const handleDeactivate = useCallback(async () => {
    try {
      setPending(true)
      if (useGatekeeper) {
        if (!password) {
          setError(_(msg`Please enter your password.`))
          setPending(false)
          return
        }
        await gateDeactivateAccount({
          serviceUrl: currentAccount.service,
          did: currentAccount.did,
          password,
        })
      } else {
        await agent.com.atproto.server.deactivateAccount({})
      }
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
        case 'Invalid password':
          setError(_(msg`Invalid password. Please try again.`))
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
  }, [
    agent,
    control,
    logoutCurrentAccount,
    _,
    setPending,
    useGatekeeper,
    password,
    currentAccount,
  ])

  return (
    <>
      <Prompt.TitleText>{_(msg`Deactivate account`)}</Prompt.TitleText>
      <Prompt.DescriptionText>
        <Trans>
          Your profile, posts, feeds, and lists will no longer be visible to
          other {brand.metadata.displayName} users. You can reactivate your
          account at any time by logging in.
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

        {useGatekeeper && (
          <View style={[a.pb_lg]}>
            <Text
              style={[a.pb_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
              <Trans>Please enter your password to continue.</Trans>
            </Text>
            <TextField.Root>
              <TextField.Icon icon={Lock} />
              <TextField.Input
                label={_(msg`Password`)}
                placeholder={_(msg`Password`)}
                defaultValue={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
                autoCapitalize="none"
              />
            </TextField.Root>
          </View>
        )}

        <Divider />
      </View>
      <Prompt.Actions>
        <Button
          color="negative"
          size="large"
          label={_(msg`Yes, deactivate`)}
          onPress={handleDeactivate}
          disabled={useGatekeeper && !password}>
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
