import {useCallback, useState} from 'react'
import {View} from 'react-native'
import {useLingui} from '@lingui/react/macro'
import {Trans} from '@lingui/react/macro'

import {logger} from '#/logger'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useVerificationCreateMutation} from '#/state/queries/verification/useVerificationCreateMutation'
import {atoms as a, useBreakpoints} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {type DialogControlProps} from '#/components/Dialog'
import {VerifiedCheck} from '#/components/icons/VerifiedCheck'
import {Loader} from '#/components/Loader'
import * as ProfileCard from '#/components/ProfileCard'
import * as Prompt from '#/components/Prompt'
import * as Toast from '#/components/Toast'
import type * as bsky from '#/types/bsky'

export function VerificationCreatePrompt({
  control,
  profile,
}: {
  control: DialogControlProps
  profile: bsky.profile.AnyProfileView
}) {
  const {t: l} = useLingui()
  const {gtMobile} = useBreakpoints()
  const moderationOpts = useModerationOpts()
  const {mutateAsync: create, isPending} = useVerificationCreateMutation()
  const [error, setError] = useState(``)
  const onConfirm = useCallback(async () => {
    try {
      await create({profile})
      Toast.show(l`Successfully verified`)
      control.close()
    } catch (e) {
      setError(l`Verification failed, please try again.`)
      logger.error('Failed to create a verification', {
        safeMessage: e,
      })
    }
  }, [l, profile, create, control])

  return (
    <Prompt.Outer control={control}>
      <View style={[a.flex_row, a.align_center, a.gap_sm, a.pb_sm]}>
        <VerifiedCheck width={18} />
        <Prompt.TitleText style={[a.pb_0]}>
          {l`Verify this account?`}
        </Prompt.TitleText>
      </View>
      <Prompt.DescriptionText>
        {l`This action can be undone at any time.`}
      </Prompt.DescriptionText>
      {moderationOpts ? (
        <ProfileCard.Header>
          <ProfileCard.Avatar
            profile={profile}
            moderationOpts={moderationOpts}
          />
          <ProfileCard.NameAndHandle
            profile={profile}
            moderationOpts={moderationOpts}
          />
        </ProfileCard.Header>
      ) : null}
      {error && (
        <View style={[a.pt_lg]}>
          <Admonition type="error">{error}</Admonition>
        </View>
      )}
      <View style={[a.pt_xl]}>
        {profile.displayName ? (
          <Prompt.Actions>
            <Button
              variant="solid"
              color="primary"
              size={gtMobile ? 'small' : 'large'}
              label={l`Verify account`}
              onPress={onConfirm}>
              <ButtonText>{l`Verify account`}</ButtonText>
              {isPending && <ButtonIcon icon={Loader} />}
            </Button>
            <Prompt.Cancel />
          </Prompt.Actions>
        ) : (
          <Admonition type="warning">
            <Trans>
              This user does not have a display name, and therefore cannot be
              verified.
            </Trans>
          </Admonition>
        )}
      </View>
      <Dialog.Close />
    </Prompt.Outer>
  )
}
