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
  openDialogs: React.MutableRefObject<Set<string>>
}>({
  activeDialogs: {
    current: new Map(),
  },
  openDialogs: {
    current: new Set(),
  },
})

const DialogControlContext = React.createContext<{
  closeAllDialogs(): boolean
}>({
  closeAllDialogs: () => false,
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
  const openDialogs = React.useRef<Set<string>>(new Set())

  const closeAllDialogs = React.useCallback(() => {
    activeDialogs.current.forEach(dialog => dialog.current.close())
    return openDialogs.current.size > 0
  }, [])

  const context = React.useMemo(() => ({activeDialogs, openDialogs}), [])
  const controls = React.useMemo(() => ({closeAllDialogs}), [closeAllDialogs])

  return (
    <DialogContext.Provider value={context}>
      <DialogControlContext.Provider value={controls}>
        <GlobalDialogsProvider>{children}</GlobalDialogsProvider>
      </DialogControlContext.Provider>
    </DialogContext.Provider>
  )
}
