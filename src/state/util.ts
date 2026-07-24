import {useCallback} from 'react'

import {useDialogStateControlContext} from '#/state/dialogs'
import {useLightboxControls} from '#/components/Lightbox/state'
import {useComposerControls} from './shell/composer'
import {useSetDrawerOpen} from './shell/drawer-open'

/**
 * returns true if something was closed
 * (used by the android hardware back btn)
 */
export function useCloseAnyActiveElement() {
  const {closeLightbox} = useLightboxControls()
  const {closeComposer} = useComposerControls()
  const {closeAllDialogs} = useDialogStateControlContext()
  const setDrawerOpen = useSetDrawerOpen()
  return useCallback(() => {
    if (closeLightbox()) {
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
  }, [closeLightbox, closeComposer, setDrawerOpen, closeAllDialogs])
}

/**
 * used to clear out any modals, eg for a navigation
 */
export function useCloseAllActiveElements() {
  const {closeLightbox} = useLightboxControls()
  const {closeComposer} = useComposerControls()
  const {closeAllDialogs: closeAlfDialogs} = useDialogStateControlContext()
  const setDrawerOpen = useSetDrawerOpen()
  return useCallback(() => {
    closeLightbox()
    closeComposer()
    closeAlfDialogs()
    setDrawerOpen(false)
  }, [closeLightbox, closeComposer, closeAlfDialogs, setDrawerOpen])
}

/**
 * Close all active elements and resolve once dialogs that were open have
 * finished dismissing.
 */
export function useCloseAllActiveElementsAndWait() {
  const {closeLightbox} = useLightboxControls()
  const {closeComposer} = useComposerControls()
  const {closeAllDialogsAndWait} = useDialogStateControlContext()
  const setDrawerOpen = useSetDrawerOpen()
  return useCallback(async () => {
    closeLightbox()
    closeComposer()
    setDrawerOpen(false)
    await closeAllDialogsAndWait()
  }, [closeLightbox, closeComposer, closeAllDialogsAndWait, setDrawerOpen])
}
