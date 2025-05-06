import {createContext, useContext, useMemo, useState} from 'react'

import * as Dialog from '#/components/Dialog'

type Control = Dialog.DialogControlProps

export type StatefulControl<T> = {
  control: Control
  open: (value: T) => void
  clear: () => void
  value: T | undefined
}

type ControlsContext = {
  mutedWordsDialogControl: Control
  signinDialogControl: Control
  inAppBrowserConsentControl: StatefulControl<string>
  linkWarningDialogControl: StatefulControl<{
    href: string
    displayText: string
    share?: boolean
  }>
}

const ControlsContext = createContext<ControlsContext | null>(null)

export function useGlobalDialogsControlContext() {
  const ctx = useContext(ControlsContext)
  if (!ctx) {
    throw new Error(
      'useGlobalDialogsControlContext must be used within a Provider',
    )
  }
  return ctx
}

export function Provider({children}: React.PropsWithChildren<{}>) {
  const mutedWordsDialogControl = Dialog.useDialogControl()
  const signinDialogControl = Dialog.useDialogControl()
  const inAppBrowserConsentControl = useStatefulDialogControl<string>()
  const linkWarningDialogControl = useStatefulDialogControl<{
    href: string
    displayText: string
    share?: boolean
  }>()

  const ctx = useMemo<ControlsContext>(
    () => ({
      mutedWordsDialogControl,
      signinDialogControl,
      inAppBrowserConsentControl,
      linkWarningDialogControl,
    }),
    [
      mutedWordsDialogControl,
      signinDialogControl,
      inAppBrowserConsentControl,
      linkWarningDialogControl,
    ],
  )

  return (
    <ControlsContext.Provider value={ctx}>{children}</ControlsContext.Provider>
  )
}

function useStatefulDialogControl<T>(initialValue?: T): StatefulControl<T> {
  const [value, setValue] = useState(initialValue)
  const control = Dialog.useDialogControl()
  return useMemo(
    () => ({
      control,
      open: (v: T) => {
        setValue(v)
        control.open()
      },
      clear: () => setValue(initialValue),
      value,
    }),
    [control, value, initialValue],
  )
}
