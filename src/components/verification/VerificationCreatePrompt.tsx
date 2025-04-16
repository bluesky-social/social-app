import {useCallback} from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {logger} from '#/logger'
import {useVerificationCreateMutation} from '#/state/queries/verification/useVerificationCreateMutation'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a} from '#/alf'
import {type DialogControlProps} from '#/components/Dialog'
import {VerifiedCheck} from '#/components/icons/VerifiedCheck'
import * as Prompt from '#/components/Prompt'
import type * as bsky from '#/types/bsky'

export function VerificationCreatePrompt({
  control,
  userName,
  profile,
}: {
  control: DialogControlProps
  userName: string
  profile: bsky.profile.AnyProfileView
}) {
  const {_} = useLingui()
  const {mutateAsync: create} = useVerificationCreateMutation()
  const onConfirm = useCallback(async () => {
    try {
      await create({
        did: profile.did,
        handle: profile.handle,
        displayName: profile.displayName || '',
      })
      Toast.show(_(msg`Successfully verified`))
    } catch (e) {
      Toast.show(_(msg`Failed to create a verification`), 'xmark')
      logger.error('Failed to create a verification', {
        safeMessage: e,
      })
    }
  }, [_, profile, create])

  return (
    <Prompt.Outer control={control}>
      <View style={[a.flex_row, a.align_center, a.gap_sm, a.pb_sm]}>
        <VerifiedCheck width={18} />
        <Prompt.TitleText style={[a.pb_0]}>
          {_(msg`Verify ${userName}`)}
        </Prompt.TitleText>
      </View>
      <Prompt.DescriptionText>
        {_(
          msg`Would you like to verify ${userName}’s account? This can be undone at anytime.`,
        )}
      </Prompt.DescriptionText>
      <Prompt.Actions>
        <Prompt.Action cta={_(msg`Verify account`)} onPress={onConfirm} />
        <Prompt.Cancel />
      </Prompt.Actions>
    </Prompt.Outer>
  )
}
