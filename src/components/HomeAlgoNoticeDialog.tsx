import React from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {DialogOuterProps} from '#/components/Dialog'
import * as Prompt from '#/components/Prompt'

export function HomeAlgoNoticeDialog({
  control,
}: {
  control: DialogOuterProps['control']
}) {
  const {_} = useLingui()
  return (
    <Prompt.Outer control={control}>
      <Prompt.TitleText>Your home algorithm</Prompt.TitleText>
      <Prompt.DescriptionText>
        This feed is set as your home algorithm, which is used as your home
        screen when you open the app.
      </Prompt.DescriptionText>
      <Prompt.Actions>
        <Prompt.Cancel cta={_(msg`Close`)} />
      </Prompt.Actions>
    </Prompt.Outer>
  )
}
