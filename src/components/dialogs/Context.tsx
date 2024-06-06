import {createContext, PropsWithChildren, useContext, useMemo} from 'react'

import * as Dialog from '#/components/Dialog'

type Control = Dialog.DialogOuterProps['control']

type ControlsContext = {
  mutedWordsDialogControl: Control
  signinDialogControl: Control
}

const ControlsContext = createContext({
  mutedWordsDialogControl: {} as Control,
  signinDialogControl: {} as Control,
})

export function useGlobalDialogsControlContext() {
  return useContext(ControlsContext)
}

export function Provider({children}: PropsWithChildren<{}>) {
  const mutedWordsDialogControl = Dialog.useDialogControl()
  const signinDialogControl = Dialog.useDialogControl()
  const ctx = useMemo<ControlsContext>(
    () => ({mutedWordsDialogControl, signinDialogControl}),
    [mutedWordsDialogControl, signinDialogControl],
  )

  return (
    <ControlsContext.Provider value={ctx}>{children}</ControlsContext.Provider>
  )
}
