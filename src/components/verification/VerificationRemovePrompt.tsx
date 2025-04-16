import {useCallback} from 'react'
import {type AppBskyActorDefs} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {logger} from '#/logger'
import {useVerificationsRemoveMutation} from '#/state/queries/verification/useVerificationsRemoveMutation'
import * as Toast from '#/view/com/util/Toast'
import {type DialogControlProps} from '#/components/Dialog'
import * as Prompt from '#/components/Prompt'
import type * as bsky from '#/types/bsky'

export {useDialogControl as usePromptControl} from '#/components/Dialog'

export function VerificationRemovePrompt({
  control,
  userName,
  profile,
  verifications,
}: {
  control: DialogControlProps
  userName: string
  profile: bsky.profile.AnyProfileView
  verifications: AppBskyActorDefs.VerificationView[]
}) {
  const {_} = useLingui()
  const {mutateAsync: remove} = useVerificationsRemoveMutation()
  const onConfirm = useCallback(async () => {
    try {
      await remove({
        did: profile.did,
        verifications,
      })
      Toast.show(_(msg`Removed verification`))
    } catch (e) {
      Toast.show(_(msg`Failed to remove verification`), 'xmark')
      logger.error('Failed to remove verification', {
        safeMessage: e,
      })
    }
  }, [_, profile, verifications, remove])

  return (
    <Prompt.Basic
      control={control}
      title={_(msg`Remove verification of ${userName}?`)}
      description={_(
        msg`Would you like to remove your verification of ${userName}?`,
      )}
      onConfirm={onConfirm}
      confirmButtonCta={_(msg`Remove verification`)}
      confirmButtonColor="negative"
    />
  )
}
