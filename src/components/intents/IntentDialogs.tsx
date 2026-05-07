import {createContext, useContext, useMemo, useState} from 'react'

import * as Dialog from '#/components/Dialog'
import {type DialogControlProps} from '#/components/Dialog'
import {VerifyEmailIntentDialog} from '#/components/intents/VerifyEmailIntentDialog'

interface Context {
  verifyEmailDialogControl: DialogControlProps
  verifyEmailState: {code: string} | undefined
  setVerifyEmailState: (state: {code: string} | undefined) => void
}

const Context = createContext({} as Context)
Context.displayName = 'IntentDialogsContext'
export const useIntentDialogs = () => useContext(Context)

export function Provider({children}: {children: React.ReactNode}) {
  const verifyEmailDialogControl = Dialog.useDialogControl()
  const [verifyEmailState, setVerifyEmailState] = useState<
    {code: string} | undefined
  >()

  const value = useMemo(
    () => ({
      verifyEmailDialogControl,
      verifyEmailState,
      setVerifyEmailState,
    }),
    [verifyEmailDialogControl, verifyEmailState, setVerifyEmailState],
  )

  return (
    <Context.Provider value={value}>
      {children}
      <VerifyEmailIntentDialog />
    </Context.Provider>
  )
}
