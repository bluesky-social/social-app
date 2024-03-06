import React from 'react'
import {DialogControlRefProps} from '#/components/Dialog'
import {Provider as GlobalDialogsProvider} from '#/components/dialogs/Context'

const DialogContext = React.createContext<{
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
  openDialogs: string[]
}>({
  activeDialogs: {
    current: new Map(),
  },
  openDialogs: [],
})

const DialogControlContext = React.createContext<{
  closeAllDialogs(): boolean
  setDialogIsOpen(id: string, isOpen: boolean): void
}>({
  closeAllDialogs: () => false,
  setDialogIsOpen: () => {},
})

export function useDialogStateContext() {
  return React.useContext(DialogContext)
}

export function useDialogStateControlContext() {
  return React.useContext(DialogControlContext)
}

export function Provider({children}: React.PropsWithChildren<{}>) {
  const activeDialogs = React.useRef<
    Map<string, React.MutableRefObject<DialogControlRefProps>>
  >(new Map())
  const [openDialogs, setOpenDialogs] = React.useState<string[]>([])

  const closeAllDialogs = React.useCallback(() => {
    activeDialogs.current.forEach(dialog => dialog.current.close())
    return openDialogs.length > 0
  }, [openDialogs])

  const setDialogIsOpen = React.useCallback(
    (id: string, isOpen: boolean) => {
      setOpenDialogs(prev => {
        const filtered = prev.filter(dialogId => dialogId !== id) as string[]
        return isOpen ? [...filtered, id] : filtered
      })
    },
    [setOpenDialogs],
  )

  const context = React.useMemo(
    () => ({activeDialogs, openDialogs}),
    [openDialogs],
  )
  const controls = React.useMemo(
    () => ({closeAllDialogs, setDialogIsOpen}),
    [closeAllDialogs, setDialogIsOpen],
  )

  return (
    <DialogContext.Provider value={context}>
      <DialogControlContext.Provider value={controls}>
        <GlobalDialogsProvider>{children}</GlobalDialogsProvider>
      </DialogControlContext.Provider>
    </DialogContext.Provider>
  )
}
