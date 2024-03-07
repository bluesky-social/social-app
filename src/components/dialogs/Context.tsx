import React from 'react'

import * as Dialog from '#/components/Dialog'
import {ConfirmDialogOptions} from '#/components/dialogs/DialogOptions'

type Control<T extends Dialog.DialogExtraOpts<T> = {}> =
  Dialog.DialogOuterProps<T>['control']

type ControlsContext = {
  mutedWordsDialogControl: Control
  confirmDialogControl: Control<ConfirmDialogOptions>
}

const ControlsContext = React.createContext({
  mutedWordsDialogControl: {} as Control,
  confirmDialogControl: {} as Control<ConfirmDialogOptions>,
})

export function useGlobalDialogsControlContext() {
  return React.useContext(ControlsContext)
}

export function Provider({children}: React.PropsWithChildren<{}>) {
  const mutedWordsDialogControl = Dialog.useDialogControl({})
  const confirmDialogControl = Dialog.useDialogControl<ConfirmDialogOptions>()
  const ctx = React.useMemo(
    () => ({mutedWordsDialogControl, confirmDialogControl}),
    [confirmDialogControl, mutedWordsDialogControl],
  )

  return (
    <ControlsContext.Provider value={ctx}>{children}</ControlsContext.Provider>
  )
}
