import React from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {DialogOuterProps} from '#/components/Dialog'
import * as Prompt from '#/components/Prompt'

export function LeaveConvoPrompt({
  control,
  onLeaveConvo,
}: {
  control: DialogOuterProps['control']
  onLeaveConvo: () => void
}) {
  const {_} = useLingui()

  return (
    <Prompt.Basic
      control={control}
      title={_(msg`Leave conversation`)}
      description={_(
        msg`Are you sure you want to leave this conversation? Your messages will be deleted for you, but not for the other participant.`,
      )}
      confirmButtonCta={_(msg`Leave`)}
      confirmButtonColor="negative"
      onConfirm={onLeaveConvo}
    />
  )
}
