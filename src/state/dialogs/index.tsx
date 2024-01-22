import React from 'react'
import {DialogControlProps} from '#/components/Dialog'

const DialogContext = React.createContext<{
  activeDialogs: React.MutableRefObject<
    Map<string, React.MutableRefObject<DialogControlProps>>
  >
}>({
  activeDialogs: {
    current: new Map(),
  },
})

const DialogControlContext = React.createContext<{
  closeAllDialogs(): void
}>({
  closeAllDialogs: () => {},
})

export function useDialogStateContext() {
  return React.useContext(DialogContext)
}

export function useDialogStateControlContext() {
  return React.useContext(DialogControlContext)
}

export function Provider({children}: React.PropsWithChildren<{}>) {
  const activeDialogs = React.useRef<
    Map<string, React.MutableRefObject<DialogControlProps>>
  >(new Map())
  const closeAllDialogs = React.useCallback(() => {
    activeDialogs.current.forEach(dialog => dialog.current.close())
  }, [])
  const context = React.useMemo(() => ({activeDialogs}), [])
  const controls = React.useMemo(() => ({closeAllDialogs}), [closeAllDialogs])
  return (
    <DialogContext.Provider value={context}>
      <DialogControlContext.Provider value={controls}>
        {children}
      </DialogControlContext.Provider>
    </DialogContext.Provider>
  )
}
