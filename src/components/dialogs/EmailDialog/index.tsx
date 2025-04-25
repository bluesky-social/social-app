import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import * as Dialog from '#/components/Dialog'
import {ScreenID, Screen} from '#/components/dialogs/EmailDialog/types'

/*
 * Steps
 */
import {Update} from '#/components/dialogs/EmailDialog/screens/Update'

export {useDialogControl} from '#/components/Dialog'
export {ScreenID, type Screen} from '#/components/dialogs/EmailDialog/types'

export function EmailDialog({
  control,
  initialScreen,
}: {
  control: Dialog.DialogControlProps
  initialScreen: Screen
}) {
  const {_} = useLingui()

  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />

      <Dialog.ScrollableInner label={_(msg`Make adjustments to your account email settings`)} style={[{maxWidth: 400}]}>
        <Inner control={control} initialScreen={initialScreen} />
        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

function Inner({
  initialScreen,
}: {
  control: Dialog.DialogControlProps
  initialScreen: Screen
}) {
  switch (initialScreen.id) {
    case ScreenID.Update: {
      return (
        <Update />
      )
    }
    default: {
      return null
    }
  }
}
