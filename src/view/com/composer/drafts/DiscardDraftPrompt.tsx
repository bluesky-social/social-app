import React from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {DialogOuterProps} from '#/components/Dialog'
import * as Prompt from '#/components/Prompt'

export const DiscardDraftPrompt = ({
  control,
  onConfirm,
  onDiscard,
}: {
  control: DialogOuterProps['control']
  onConfirm: () => void
  onDiscard: () => void
}) => {
  const {_} = useLingui()

  return (
    <Prompt.Outer control={control} testID="discardDraftModal">
      <Prompt.TitleText>Save this draft?</Prompt.TitleText>
      <Prompt.DescriptionText>
        You can save this draft to send it at a later time.
      </Prompt.DescriptionText>

      <Prompt.Actions>
        <Prompt.Action cta={_(msg`Save`)} onPress={onConfirm} />
        <Prompt.Action
          cta={_(msg`Discard`)}
          onPress={onDiscard}
          color="secondary"
        />
      </Prompt.Actions>
    </Prompt.Outer>
  )
}
