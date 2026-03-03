import React from 'react'

import {useOpenComposer} from '#/lib/hooks/useOpenComposer'
import {shouldIgnore} from '#/lib/keyboard-shortcuts'
import {useDialogStateContext} from '#/state/dialogs'
import {useLightbox} from '#/state/lightbox'
import {useModals} from '#/state/modals'
import {useSession} from '#/state/session'
import {useIsDrawerOpen} from '#/state/shell/drawer-open'

export function useComposerKeyboardShortcut() {
  const {openComposer} = useOpenComposer()
  const {openDialogs} = useDialogStateContext()
  const {isModalActive} = useModals()
  const {activeLightbox} = useLightbox()
  const isDrawerOpen = useIsDrawerOpen()
  const {hasSession} = useSession()

  React.useEffect(() => {
    if (!hasSession) {
      return
    }

    function handler(event: KeyboardEvent) {
      if (shouldIgnore(event)) return
      if (
        openDialogs?.current.size > 0 ||
        isModalActive ||
        activeLightbox ||
        isDrawerOpen
      )
        return
      if (event.key === 'n' || event.key === 'N') {
        openComposer({logContext: 'Other'})
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [
    openComposer,
    isModalActive,
    openDialogs,
    activeLightbox,
    isDrawerOpen,
    hasSession,
  ])
}
