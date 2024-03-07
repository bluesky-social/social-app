import React from 'react'
import * as Prompt from '#/components/Prompt'
import {useGlobalDialogsControlContext} from '#/components/dialogs/Context'
import {Trans} from '@lingui/macro'
import {ConfirmDialogOptions} from '#/components/dialogs/DialogOptions'

export function ConfirmDialog() {
  const {confirmDialogControl} = useGlobalDialogsControlContext()
  const {options} = confirmDialogControl

  return (
    <Prompt.Outer<ConfirmDialogOptions> control={confirmDialogControl}>
      <Prompt.Title>{options.title}</Prompt.Title>
      <Prompt.Description>
        {options.description ? (
          options.description
        ) : (
          <Trans>Are you sure you want to perform this action?</Trans>
        )}
      </Prompt.Description>
      <Prompt.Actions>
        <Prompt.Cancel>Cancel</Prompt.Cancel>
        <Prompt.Action onPress={options?.onConfirm}>
          {options.confirm ? options.confirm : <Trans>Confirm</Trans>}
        </Prompt.Action>
      </Prompt.Actions>
    </Prompt.Outer>
  )
}
