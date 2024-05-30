import React from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {DialogOuterProps} from '#/components/Dialog'
import * as Prompt from '#/components/Prompt'

export function DeactivateAccountDialog({
  control,
}: {
  control: DialogOuterProps['control']
}) {
  const {_} = useLingui()

  return (
    <Prompt.Basic
      control={control}
      title={_(msg`Deactivate account`)}
      description={_(
        msg`Are you sure you want to deactivate your account? You won't be able to interact on the network using this account, and users won't be able to see your profile or posts.`,
      )}
      confirmButtonCta={_(msg`Yes, deactivate my account`)}
      confirmButtonColor="negative"
      onConfirm={() => {}}
    />
  )
}
