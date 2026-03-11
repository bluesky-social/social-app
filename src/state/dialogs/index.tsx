import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'

import {type DialogControlRefProps} from '#/components/Dialog'
import {Provider as GlobalDialogsProvider} from '#/components/dialogs/Context'
import {IS_WEB} from '#/env'
import {BottomSheetNativeComponent} from '../../../modules/bottom-sheet'

interface IDialogContext {
  /**
   * The currently active `useDialogControl` hooks.
   */
  activeDialogs: React.MutableRefObject<
    Map<string, React.MutableRefObject<DialogControlRefProps>>
  >
  /**
   * The currently open dialogs, referenced by their IDs, generated from
   * `useId`.
   */
  openDialogs: React.MutableRefObject<Set<string>>
}

interface IDialogControlContext {
  closeAllDialogs(): boolean
  setDialogIsOpen(id: string, isOpen: boolean): void
  setFullyExpandedCount: React.Dispatch<React.SetStateAction<number>>
}

const DialogContext = createContext<IDialogContext>({} as IDialogContext)
DialogContext.displayName = 'DialogContext'

const DialogControlContext = createContext<IDialogControlContext>(
  {} as IDialogControlContext,
)
DialogControlContext.displayName = 'DialogControlContext'

/**
 * The number of dialogs that are fully expanded. This is used to determine the background color of the status bar
 * on iOS.
 */
const DialogFullyExpandedCountContext = createContext<number>(0)
DialogFullyExpandedCountContext.displayName = 'DialogFullyExpandedCountContext'

export function useDialogStateContext() {
  return useContext(DialogContext)
}

export function useDialogStateControlContext() {
  return useContext(DialogControlContext)
}

/** The number of dialogs that are fully expanded */
export function useDialogFullyExpandedCountContext() {
  return useContext(DialogFullyExpandedCountContext)
}

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [fullyExpandedCount, setFullyExpandedCount] = useState(0)

  const activeDialogs = useRef<
    Map<string, React.MutableRefObject<DialogControlRefProps>>
  >(new Map())
  const openDialogs = useRef<Set<string>>(new Set())

  const closeAllDialogs = useCallback(() => {
    if (IS_WEB) {
      openDialogs.current.forEach(id => {
        const dialog = activeDialogs.current.get(id)
        if (dialog) dialog.current.close()
      })

      return openDialogs.current.size > 0
    } else {
      BottomSheetNativeComponent.dismissAll()
      return false
    }
  }, [])

  const setDialogIsOpen = useCallback((id: string, isOpen: boolean) => {
    if (isOpen) {
      openDialogs.current.add(id)
    } else {
      openDialogs.current.delete(id)
    }
  }, [])

  const context = useMemo<IDialogContext>(
    () => ({
      activeDialogs,
      openDialogs,
    }),
    [activeDialogs, openDialogs],
  )
  const controls = useMemo(
    () => ({
      closeAllDialogs,
      setDialogIsOpen,
      setFullyExpandedCount,
    }),
    [closeAllDialogs, setDialogIsOpen, setFullyExpandedCount],
  )

  return (
    <DialogContext.Provider value={context}>
      <DialogControlContext.Provider value={controls}>
        <DialogFullyExpandedCountContext.Provider value={fullyExpandedCount}>
          <GlobalDialogsProvider>{children}</GlobalDialogsProvider>
        </DialogFullyExpandedCountContext.Provider>
      </DialogControlContext.Provider>
    </DialogContext.Provider>
  )
}
Provider.displayName = 'DialogsProvider'
