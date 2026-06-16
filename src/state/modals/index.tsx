import {createContext, useContext, useEffect, useMemo, useState} from 'react'

import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {useHotkeysContext} from '#/lib/hotkeys'

export interface ContentLanguagesSettingsModal {
  name: 'content-languages-settings'
}

/**
 * @deprecated DO NOT ADD NEW MODALS
 */
export type Modal =
  // Curation
  ContentLanguagesSettingsModal

const ModalContext = createContext<{
  isModalActive: boolean
  activeModals: Modal[]
}>({
  isModalActive: false,
  activeModals: [],
})
ModalContext.displayName = 'ModalContext'

const ModalControlContext = createContext<{
  openModal: (modal: Modal) => void
  closeModal: () => boolean
  closeAllModals: () => boolean
}>({
  openModal: () => {},
  closeModal: () => false,
  closeAllModals: () => false,
})
ModalControlContext.displayName = 'ModalControlContext'

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [activeModals, setActiveModals] = useState<Modal[]>([])
  const {disableScope, enableScope} = useHotkeysContext()

  useEffect(() => {
    if (activeModals.length > 0) {
      disableScope('global')
    } else {
      enableScope('global')
    }
  }, [activeModals.length, disableScope, enableScope])

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

  const state = useMemo(
    () => ({
      isModalActive: activeModals.length > 0,
      activeModals,
    }),
    [activeModals],
  )

  const methods = useMemo(
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

/**
 * @deprecated use the dialog system from `#/components/Dialog.tsx`
 */
export function useModals() {
  return useContext(ModalContext)
}

/**
 * @deprecated use the dialog system from `#/components/Dialog.tsx`
 */
export function useModalControls() {
  return useContext(ModalControlContext)
}
