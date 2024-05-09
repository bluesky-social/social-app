import React from 'react'

import * as Dialog from '#/components/Dialog'

type Control = Dialog.DialogOuterProps['control']

type ControlsContext = {
  mutedWordsDialogControl: Control
  signinDialogControl: Control
}

const ControlsContext = React.createContext({
  mutedWordsDialogControl: {} as Control,
  signinDialogControl: {} as Control,
})

export function useGlobalDialogsControlContext() {
  return React.useContext(ControlsContext)
}

export function Provider({children}: React.PropsWithChildren<{}>) {
  const mutedWordsDialogControl = Dialog.useDialogControl()
  const signinDialogControl = Dialog.useDialogControl()
  const ctx = React.useMemo<ControlsContext>(
    () => ({mutedWordsDialogControl, signinDialogControl}),
    [mutedWordsDialogControl, signinDialogControl],
  )

  return (
    <ControlsContext.Provider value={ctx}>{children}</ControlsContext.Provider>
  )
}
