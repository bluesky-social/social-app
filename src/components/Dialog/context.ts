import React from 'react'
import {DialogContextProps, DialogControlProps} from '#/components/Dialog/types'

export const Context = React.createContext<DialogContextProps>({
  close: () => {},
})

export function useDialogContext() {
  return React.useContext(Context)
}

export function useDialogControl() {
  const control = React.useRef<DialogControlProps>({
    open: () => {},
    close: () => {},
  })

  return {
    ref: control,
    open: () => control.current.open(),
    close: () => control.current.close(),
  }
}
