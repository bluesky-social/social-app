import {createContext, useContext, useMemo, useState} from 'react'

import * as Dialog from '#/components/Dialog'
import {type DialogControlProps} from '#/components/Dialog'
import {GroupChatJoinDialog} from '#/components/intents/GroupChatJoinDialog'
import {VerifyEmailIntentDialog} from '#/components/intents/VerifyEmailIntentDialog'

interface Context {
  verifyEmailDialogControl: DialogControlProps
  verifyEmailState: {code: string} | undefined
  setVerifyEmailState: (state: {code: string} | undefined) => void
  groupChatJoinDialogControl: DialogControlProps
  groupChatJoinState: {code: string} | undefined
  setGroupChatJoinState: (state: {code: string} | undefined) => void
}

const Context = createContext({} as Context)
Context.displayName = 'IntentDialogsContext'
export const useIntentDialogs = () => useContext(Context)

export function Provider({children}: {children: React.ReactNode}) {
  const verifyEmailDialogControl = Dialog.useDialogControl()
  const [verifyEmailState, setVerifyEmailState] = useState<
    {code: string} | undefined
  >()
  const groupChatJoinDialogControl = Dialog.useDialogControl()
  const [groupChatJoinState, setGroupChatJoinState] = useState<
    {code: string} | undefined
  >()

  const value = useMemo(
    () => ({
      verifyEmailDialogControl,
      verifyEmailState,
      setVerifyEmailState,
      groupChatJoinDialogControl,
      groupChatJoinState,
      setGroupChatJoinState,
    }),
    [
      verifyEmailDialogControl,
      verifyEmailState,
      setVerifyEmailState,
      groupChatJoinDialogControl,
      groupChatJoinState,
      setGroupChatJoinState,
    ],
  )

  return (
    <Context.Provider value={value}>
      {children}
      <VerifyEmailIntentDialog />
      <GroupChatJoinDialog />
    </Context.Provider>
  )
}
