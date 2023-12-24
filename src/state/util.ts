import {useCallback} from 'react'
import {useModalControls} from './modals'
import {useComposerControls} from './shell/composer'
import {useSetDrawerOpen} from './shell/drawer-open'
import {useImageViewer} from 'view/com/imageviewer'

/**
 * returns true if something was closed
 * (used by the android hardware back btn)
 */
export function useCloseAnyActiveElement() {
  const {closeModal} = useModalControls()
  const {closeComposer} = useComposerControls()
  const setDrawerOpen = useSetDrawerOpen()
  const {state: viewerState, dispatch: viewerDispatch} = useImageViewer()
  return useCallback(() => {
    if (closeModal()) {
      return true
    }
    if (closeComposer()) {
      return true
    }
    if (viewerState.isVisible) {
      viewerDispatch({type: 'setVisible', payload: false})
    }
    setDrawerOpen(false)
    return false
  }, [closeModal, closeComposer, setDrawerOpen, viewerState, viewerDispatch])
}

/**
 * used to clear out any modals, eg for a navigation
 */
export function useCloseAllActiveElements() {
  const {closeAllModals} = useModalControls()
  const {closeComposer} = useComposerControls()
  const setDrawerOpen = useSetDrawerOpen()
  const {dispatch: viewerDispatch} = useImageViewer()
  return useCallback(() => {
    closeAllModals()
    closeComposer()
    setDrawerOpen(false)
    viewerDispatch({type: 'setVisible', payload: false})
  }, [closeAllModals, closeComposer, setDrawerOpen, viewerDispatch])
}
