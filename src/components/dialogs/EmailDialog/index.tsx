import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import * as Dialog from '#/components/Dialog'
import {Text} from '#/components/Typography'

export {useDialogControl} from '#/components/Dialog'

export function EmailDialog({
  control,
}: {
  control: Dialog.DialogControlProps
}) {
  const {_} = useLingui()

  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />

      <Dialog.ScrollableInner label={_(msg`Make adjustments to your account email settings`)}>
        <Inner control={control} />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

function Inner({
  control,
}: {
  control: Dialog.DialogControlProps
}) {
  return (
    <Text>Hello</Text>
  )
}
