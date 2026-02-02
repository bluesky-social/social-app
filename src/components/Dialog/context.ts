import {
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
} from 'react'

import {useDialogStateContext} from '#/state/dialogs'
import {
  type DialogContextProps,
  type DialogControlRefProps,
  type DialogOuterProps,
} from '#/components/Dialog/types'
import {IS_DEV} from '#/env'
import {BottomSheetSnapPoint} from '../../../modules/bottom-sheet/src/BottomSheet.types'

export const Context = createContext<DialogContextProps>({
  close: () => {},
  IS_NATIVEDialog: false,
  nativeSnapPoint: BottomSheetSnapPoint.Hidden,
  disableDrag: false,
  setDisableDrag: () => {},
  isWithinDialog: false,
})
Context.displayName = 'DialogContext'

export function useDialogContext() {
  return useContext(Context)
}

export function useDialogControl(): DialogOuterProps['control'] {
  const id = useId()
  const control = useRef<DialogControlRefProps>({
    open: () => {},
    close: () => {},
  })
  const {activeDialogs} = useDialogStateContext()

  useEffect(() => {
    activeDialogs.current.set(id, control)
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      activeDialogs.current.delete(id)
    }
  }, [id, activeDialogs])

  return useMemo<DialogOuterProps['control']>(
    () => ({
      id,
      ref: control,
      open: () => {
        if (control.current) {
          control.current.open()
        } else {
          if (IS_DEV) {
            console.warn(
              'Attemped to open a dialog control that was not attached to a dialog!\n' +
                'Please ensure that the Dialog is mounted when calling open/close',
            )
          }
        }
      },
      close: cb => {
        if (control.current) {
          control.current.close(cb)
        } else {
          if (IS_DEV) {
            console.warn(
              'Attemped to close a dialog control that was not attached to a dialog!\n' +
                'Please ensure that the Dialog is mounted when calling open/close',
            )
          }
        }
      },
    }),
    [id, control],
  )
}
