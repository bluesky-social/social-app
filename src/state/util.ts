import {useCallback} from 'react'

import {useDialogStateControlContext} from '#/state/dialogs'
import {useLightboxControls} from './lightbox'
import {useModalControls} from './modals'
import {useComposerControls} from './shell/composer'
import {useSetDrawerOpen} from './shell/drawer-open'

/**
 * returns true if something was closed
 * (used by the android hardware back btn)
 */
export function useCloseAnyActiveElement() {
  const {closeLightbox} = useLightboxControls()
  const {closeModal} = useModalControls()
  const {closeComposer} = useComposerControls()
  const {closeAllDialogs} = useDialogStateControlContext()
  const setDrawerOpen = useSetDrawerOpen()
  return useCallback(() => {
    if (closeLightbox()) {
      return true
    }
    if (closeModal()) {
      return true
    }
    if (closeAllDialogs()) {
      return true
    }
    if (closeComposer()) {
      return true
    }
    setDrawerOpen(false)
    return false
  }, [closeLightbox, closeModal, closeComposer, setDrawerOpen, closeAllDialogs])
}

/**
 * used to clear out any modals, eg for a navigation
 */
export function useCloseAllActiveElements() {
  const {closeLightbox} = useLightboxControls()
  const {closeAllModals} = useModalControls()
  const {closeComposer} = useComposerControls()
  const {closeAllDialogs: closeAlfDialogs} = useDialogStateControlContext()
  const setDrawerOpen = useSetDrawerOpen()
  return useCallback(() => {
    closeLightbox()
    closeAllModals()
    closeComposer()
    closeAlfDialogs()
    setDrawerOpen(false)
  }, [
    closeLightbox,
    closeAllModals,
    closeComposer,
    closeAlfDialogs,
    setDrawerOpen,
  ])
}
