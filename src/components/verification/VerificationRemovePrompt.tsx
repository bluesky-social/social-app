import {useCallback} from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {type DialogControlProps} from '#/components/Dialog'
import * as Prompt from '#/components/Prompt'

export {useDialogControl as usePromptControl} from '#/components/Dialog'

export function VerificationRemovePrompt({
  control,
  userName,
}: {
  control: DialogControlProps
  userName: string
}) {
  const {_} = useLingui()
  const onConfirm = useCallback(() => {}, [])

  return (
    <Prompt.Basic
      control={control}
      title={_(msg`Remove verification for ${userName}?`)}
      description={_(
        msg`Would you like to remove your verification from ${userName}?`,
      )}
      onConfirm={onConfirm}
      confirmButtonCta={_(msg`Remove verification`)}
      confirmButtonColor="negative"
    />
  )
}
