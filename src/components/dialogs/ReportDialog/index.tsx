import React from 'react'

import * as Dialog from '#/components/Dialog'
import {Text} from '#/components/Typography'
import {Context} from '#/components/dialogs'

export type DialogParams =
  | {
      type: 'post'
      uri: string
      cid: string
    }
  | {
      type: 'user'
      did: string
    }

export function useReportDialogControl() {
  return React.useContext(Context).report
}

export function ReportDialog() {
  const control = useReportDialogControl()

  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />

      <Dialog.ScrollableInner label="Report dialog">
        <Inner />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

function Inner() {
  const ctx = Dialog.useDialogContext<DialogParams>()
  return <Text>hello {JSON.stringify(ctx.params)}</Text>
}
