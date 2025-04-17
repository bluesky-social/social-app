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
  profile,
  verifications,
  onConfirm: onConfirmInner,
}: {
  control: DialogControlProps
  profile: bsky.profile.AnyProfileView
  verifications: AppBskyActorDefs.VerificationView[]
  onConfirm?: () => void
}) {
  const {_} = useLingui()
  const {mutateAsync: remove} = useVerificationsRemoveMutation()
  const onConfirm = useCallback(async () => {
    onConfirmInner?.()
    try {
      await remove({profile, verifications})
      Toast.show(_(msg`Removed verification`))
    } catch (e) {
      Toast.show(_(msg`Failed to remove verification`), 'xmark')
      logger.error('Failed to remove verification', {
        safeMessage: e,
      })
    }
  }, [_, profile, verifications, remove, onConfirmInner])

  return (
    <Prompt.Basic
      control={control}
      title={_(msg`Remove your verification for this account?`)}
      onConfirm={onConfirm}
      confirmButtonCta={_(msg`Remove verification`)}
      confirmButtonColor="negative"
    />
  )
}
