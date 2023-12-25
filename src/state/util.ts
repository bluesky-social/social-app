import {useCallback} from 'react'
import {useModalControls} from './modals'
import {useComposerControls} from './shell/composer'
import {useSetDrawerOpen} from './shell/drawer-open'
import {useImageViewerControls} from 'state/imageViewer'

/**
 * returns true if something was closed
 * (used by the android hardware back btn)
 */
export function useCloseAnyActiveElement() {
  const {closeModal} = useModalControls()
  const {closeComposer} = useComposerControls()
  const setDrawerOpen = useSetDrawerOpen()
  const {setVisible: setImageViewerVisible} = useImageViewerControls()
  return useCallback(() => {
    if (closeModal()) {
      return true
    }
    if (closeComposer()) {
      return true
    }
    setImageViewerVisible(false)
    setDrawerOpen(false)
    return false
  }, [closeModal, closeComposer, setImageViewerVisible, setDrawerOpen])
}

/**
 * used to clear out any modals, eg for a navigation
 */
export function useCloseAllActiveElements() {
  const {closeAllModals} = useModalControls()
  const {closeComposer} = useComposerControls()
  const setDrawerOpen = useSetDrawerOpen()
  const {setVisible: setImageViewerVisible} = useImageViewerControls()
  return useCallback(() => {
    closeAllModals()
    closeComposer()
    setDrawerOpen(false)
    setImageViewerVisible(false)
  }, [closeAllModals, closeComposer, setDrawerOpen, setImageViewerVisible])
}
