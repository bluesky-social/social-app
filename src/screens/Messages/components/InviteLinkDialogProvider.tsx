import {createContext, useContext} from 'react'

import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useSession} from '#/state/session'
import * as Dialog from '#/components/Dialog'
import {type ConvoWithDetails} from '#/components/dms/util'
import {InviteLinkDialog} from './InviteLinkDialog'

const Context = createContext<Dialog.DialogControlProps | null>(null)

export function useInviteLinkDialog() {
  return useContext(Context)
}

export function InviteLinkDialogProvider({
  convo,
  children,
}: {
  convo: ConvoWithDetails | undefined
  children: React.ReactNode
}) {
  if (convo?.kind !== 'group') {
    return <>{children}</>
  }
  return (
    <GroupInviteLinkDialogProvider convo={convo}>
      {children}
    </GroupInviteLinkDialogProvider>
  )
}

function GroupInviteLinkDialogProvider({
  convo,
  children,
}: {
  convo: Extract<ConvoWithDetails, {kind: 'group'}>
  children: React.ReactNode
}) {
  const {currentAccount} = useSession()
  const control = Dialog.useDialogControl()
  const moderationOpts = useModerationOpts()
  const owner = convo.primaryMember

  if (!owner || !moderationOpts) {
    return <>{children}</>
  }

  const isOwner = owner.did === currentAccount?.did

  return (
    <Context.Provider value={control}>
      {children}
      <InviteLinkDialog
        convo={convo}
        control={control}
        owner={owner}
        isOwner={isOwner}
        moderationOpts={moderationOpts}
      />
    </Context.Provider>
  )
}
