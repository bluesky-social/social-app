import {
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
} from 'react'

import {logger} from '#/logger'
import {useDialogStateContext} from '#/state/dialogs'
import {
  type DialogContextProps,
  type DialogControlRefProps,
  type DialogOuterProps,
} from '#/components/Dialog/types'
import {BottomSheetSnapPoint} from '../../../modules/bottom-sheet/src/BottomSheet.types'

export const Context = createContext<DialogContextProps>({
  close: () => {},
  isNativeDialog: false,
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
        try {
          control.current.open()
        } catch (err) {
          // note: we're seeing 100 crashes/day from the composer discard warning
          // dialog being triggered by the android system back button immediately after posting
          // Error is "Cannot read property 'open' of null"
          // Is there a better way to handle this? I've try/catch'd this for now -sfn
          logger.warn('Could not open dialog', {safeMessage: err})
        }
      },
      close: cb => {
        control.current.close(cb)
      },
    }),
    [id, control],
  )
}
