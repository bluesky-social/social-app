import {useHotkeys} from 'react-hotkeys-hook'

import {useOpenComposer} from '#/lib/hooks/useOpenComposer'
import {useDialogStateContext} from '#/state/dialogs'
import {emitFocusSearch} from '#/state/events'
import {useLightbox} from '#/state/lightbox'
import {useModals} from '#/state/modals'
import {useSession} from '#/state/session'
import {useIsDrawerOpen} from '#/state/shell/drawer-open'

export function useKeyboardShortcuts() {
  const {openComposer} = useOpenComposer()
  const {openDialogs} = useDialogStateContext()
  const {isModalActive} = useModals()
  const {activeLightbox} = useLightbox()
  const isDrawerOpen = useIsDrawerOpen()
  const {hasSession} = useSession()

  const shouldIgnore = () => {
    if (!hasSession) {
      return true
    }

    if (
      openDialogs?.current.size > 0 ||
      isModalActive ||
      activeLightbox ||
      isDrawerOpen
    ) {
      return true
    }

    return false
  }

  const handleKey = (callback: () => void) => {
    if (shouldIgnore()) {
      return
    }
    callback()
  }

  useHotkeys(
    'n',
    () =>
      handleKey(() => {
        openComposer({logContext: 'Other'})
      }),
    {scopes: ['composer']},
  )

  useHotkeys('slash', () => handleKey(emitFocusSearch), {
    scopes: ['search'],
    preventDefault: true,
  })
}
