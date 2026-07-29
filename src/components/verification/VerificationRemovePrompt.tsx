import {useCallback} from 'react'
import {type AppBskyActorDefs} from '@atproto/api'
import {useLingui} from '@lingui/react/macro'

import {logger} from '#/logger'
import {useVerificationsRemoveMutation} from '#/state/queries/verification/useVerificationsRemoveMutation'
import {type DialogControlProps} from '#/components/Dialog'
import * as Prompt from '#/components/Prompt'
import * as Toast from '#/components/Toast'
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
  const {t: l} = useLingui()
  const {mutateAsync: remove} = useVerificationsRemoveMutation()
  const onConfirm = useCallback(async () => {
    onConfirmInner?.()
    try {
      await remove({profile, verifications})
      Toast.show(l`Removed verification`)
    } catch (e) {
      Toast.show(l`Failed to remove verification`, {
        type: 'error',
      })
      logger.error('Failed to remove verification', {
        safeMessage: e,
      })
    }
  }, [l, profile, verifications, remove, onConfirmInner])

  return (
    <Prompt.Basic
      control={control}
      title={l`Remove your verification for this account?`}
      onConfirm={onConfirm}
      confirmButtonCta={l`Remove verification`}
      confirmButtonColor="negative"
    />
  )
}
