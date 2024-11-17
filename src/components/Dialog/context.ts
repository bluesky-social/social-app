import React from 'react'

import {useDialogStateContext} from '#/state/dialogs'
import {
  DialogContextProps,
  DialogControlRefProps,
  DialogOuterProps,
} from '#/components/Dialog/types'
import {BottomSheetSnapPoint} from '../../../modules/bottom-sheet/src/BottomSheet.types'

export const Context = React.createContext<DialogContextProps>({
  close: () => {},
  isNativeDialog: false,
  nativeSnapPoint: BottomSheetSnapPoint.Hidden,
  disableDrag: false,
  setDisableDrag: () => {},
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

  React.useEffect(() => {
    const map = activeDialogs.current
    map.set(id, control)
    return () => {
      map.delete(id)
    }
  }, [id, activeDialogs])

  return React.useMemo<DialogOuterProps['control']>(
    () => ({
      id,
      ref: control,
      open: () => {
        control.current.open()
      },
      close: cb => {
        control.current.close(cb)
      },
    }),
    [id, control],
  )
}
