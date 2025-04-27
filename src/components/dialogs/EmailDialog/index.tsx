import {useCallback} from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import * as Dialog from '#/components/Dialog'
import {
  type StatefulControl,
  useStatefulDialogControl,
} from '#/components/dialogs/Context'
import {useRefreshSession} from '#/components/dialogs/EmailDialog/data/useRefreshSession'
/*
 * Steps
 */
import {Update} from '#/components/dialogs/EmailDialog/screens/Update'
import {Verify} from '#/components/dialogs/EmailDialog/screens/Verify'
import {type Screen, ScreenID} from '#/components/dialogs/EmailDialog/types'

export {useDialogControl} from '#/components/Dialog'
export type {Screen} from '#/components/dialogs/EmailDialog/types'
export {ScreenID as EmailDialogScreenID} from '#/components/dialogs/EmailDialog/types'

export function useEmailDialogControl() {
  return useStatefulDialogControl<Screen>()
}

export function EmailDialog({control}: {control: StatefulControl<Screen>}) {
  const {_} = useLingui()
  const refreshSession = useRefreshSession()
  const onClose = useCallback(() => {
    /**
     * If link in any verification email is clicked, it will open a new tab.
     * When the user returns to this tab, we'll refresh their account state
     * when the dialog closes.
     */
    refreshSession()
  }, [refreshSession])

  return (
    <Dialog.Outer control={control.control} onClose={onClose}>
      <Dialog.Handle />

      <Dialog.ScrollableInner
        label={_(msg`Make adjustments to your account email settings`)}
        style={[{maxWidth: 400}]}>
        <Inner control={control} />
        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

function Inner({control}: {control: StatefulControl<Screen>}) {
  if (!control.value) return null

  switch (control.value.id) {
    case ScreenID.Update: {
      return <Update config={control.value} />
    }
    case ScreenID.Verify: {
      return <Verify config={control.value} />
    }
    default: {
      return null
    }
  }
}
