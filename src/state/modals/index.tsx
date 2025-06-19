import React from 'react'
import {type AppBskyGraphDefs} from '@atproto/api'

import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'

export interface CreateOrEditListModal {
  name: 'create-or-edit-list'
  purpose?: string
  list?: AppBskyGraphDefs.ListView
  onSave?: (uri: string) => void
}

export interface UserAddRemoveListsModal {
  name: 'user-add-remove-lists'
  subject: string
  handle: string
  displayName: string
  onAdd?: (listUri: string) => void
  onRemove?: (listUri: string) => void
}

export interface DeleteAccountModal {
  name: 'delete-account'
}

export interface WaitlistModal {
  name: 'waitlist'
}

export interface InviteCodesModal {
  name: 'invite-codes'
}

export interface ContentLanguagesSettingsModal {
  name: 'content-languages-settings'
}

export interface PostLanguagesSettingsModal {
  name: 'post-languages-settings'
}

export interface ChangePasswordModal {
  name: 'change-password'
}

export type Modal =
  // Account
  | DeleteAccountModal
  | ChangePasswordModal

  // Curation
  | ContentLanguagesSettingsModal
  | PostLanguagesSettingsModal

  // Lists
  | CreateOrEditListModal
  | UserAddRemoveListsModal

  // Bluesky access
  | WaitlistModal
  | InviteCodesModal

const ModalContext = React.createContext<{
  isModalActive: boolean
  activeModals: Modal[]
}>({
  isModalActive: false,
  activeModals: [],
})

const ModalControlContext = React.createContext<{
  openModal: (modal: Modal) => void
  closeModal: () => boolean
  closeAllModals: () => boolean
}>({
  openModal: () => {},
  closeModal: () => false,
  closeAllModals: () => false,
})

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [activeModals, setActiveModals] = React.useState<Modal[]>([])

  const openModal = useNonReactiveCallback((modal: Modal) => {
    setActiveModals(modals => [...modals, modal])
  })

  const closeModal = useNonReactiveCallback(() => {
    let wasActive = activeModals.length > 0
    setActiveModals(modals => {
      return modals.slice(0, -1)
    })
    return wasActive
  })

  const closeAllModals = useNonReactiveCallback(() => {
    let wasActive = activeModals.length > 0
    setActiveModals([])
    return wasActive
  })

  const state = React.useMemo(
    () => ({
      isModalActive: activeModals.length > 0,
      activeModals,
    }),
    [activeModals],
  )

  const methods = React.useMemo(
    () => ({
      openModal,
      closeModal,
      closeAllModals,
    }),
    [openModal, closeModal, closeAllModals],
  )

  return (
    <ModalContext.Provider value={state}>
      <ModalControlContext.Provider value={methods}>
        {children}
      </ModalControlContext.Provider>
    </ModalContext.Provider>
  )
}

export function useModals() {
  return React.useContext(ModalContext)
}

export function useModalControls() {
  return React.useContext(ModalControlContext)
}
