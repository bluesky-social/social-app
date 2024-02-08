import React from 'react'

import {useDialogStateContext} from '#/state/dialogs'
import {DialogContextProps, DialogControlProps} from '#/components/Dialog/types'

export const Context = React.createContext<DialogContextProps>({
  close: () => {},
})

export function useDialogContext() {
  return React.useContext(Context)
}

export function useDialogControl() {
  const id = React.useId()
  const control = React.useRef<DialogControlProps>({
    open: () => {},
    close: () => {},
  })
  const {activeDialogs} = useDialogStateContext()

  React.useEffect(() => {
    activeDialogs.current.set(id, control)
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      activeDialogs.current.delete(id)
    }
  }, [id, activeDialogs])

  return {
    ref: control,
    open: () => control.current.open(),
    close: () => control.current.close(),
  }
}
