import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {DialogControlProps} from '#/components/Dialog'
import * as Prompt from '#/components/Prompt'

export function ReportConversationPrompt({
  control,
}: {
  control: DialogControlProps
}) {
  const {_} = useLingui()

  return (
    <Prompt.Basic
      control={control}
      title={_(msg`Report conversation`)}
      description={_(
        msg`To report a conversation, please report one of its messages via the conversation screen. This lets our moderators understand the context of your issue.`,
      )}
      confirmButtonCta={_(msg`I understand`)}
      onConfirm={() => {}}
      showCancel={false}
    />
  )
}
