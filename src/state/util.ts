import {useCallback} from 'react'

import {useDialogStateControlContext} from '#/state/dialogs'
import {useLightboxControls} from './lightbox'
import {useModalControls} from './modals'
import {useComposerControls} from './shell/composer'

/**
 * returns true if something was closed
 * (used by the android hardware back btn)
 */
export function useCloseAnyActiveElement() {
  const {closeLightbox} = useLightboxControls()
  const {closeModal} = useModalControls()
  const {closeComposer} = useComposerControls()
  const {closeAllDialogs} = useDialogStateControlContext()
  return useCallback(() => {
    if (closeLightbox()) {
      return true
    }
    if (closeModal()) {
      return true
    }
    if (closeComposer()) {
      return true
    }
    if (closeAllDialogs()) {
      return true
    }
    return false
  }, [closeLightbox, closeModal, closeComposer, closeAllDialogs])
}

/**
 * used to clear out any modals, eg for a navigation
 */
export function useCloseAllActiveElements() {
  const {closeLightbox} = useLightboxControls()
  const {closeAllModals} = useModalControls()
  const {closeComposer} = useComposerControls()
  const {closeAllDialogs: closeAlfDialogs} = useDialogStateControlContext()
  return useCallback(() => {
    closeLightbox()
    closeAllModals()
    closeComposer()
    closeAlfDialogs()
  }, [closeLightbox, closeAllModals, closeComposer, closeAlfDialogs])
}
