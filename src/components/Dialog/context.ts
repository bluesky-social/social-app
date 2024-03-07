import React from 'react'

import {useDialogStateContext} from '#/state/dialogs'
import {
  DialogContextProps,
  DialogControlRefProps,
  DialogOuterProps,
} from '#/components/Dialog/types'

export const Context = React.createContext<DialogContextProps>({
  close: () => {},
})

export function useDialogContext() {
  return React.useContext(Context)
}

export function useDialogControl(): DialogOuterProps['control'] {
  const id = React.useId()
  const control = React.useRef<DialogControlRefProps>({
    open: () => {},
    close: () => {},
  })
  const {activeDialogs} = useDialogStateContext()

  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    activeDialogs.current.set(id, control)
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      activeDialogs.current.delete(id)
    }
  }, [id, activeDialogs])

  return React.useMemo<DialogOuterProps['control']>(
    () => ({
      id,
      ref: control,
      isOpen,
      open: () => {
        setIsOpen(true)
        control.current.open()
      },
      close: cb => {
        setIsOpen(false)
        control.current.close(cb)
      },
    }),
    [id, control, isOpen],
  )
}
