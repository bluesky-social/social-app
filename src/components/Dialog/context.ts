import React from 'react'

import {useDialogStateContext} from '#/state/dialogs'
import {
  DialogContextProps,
  DialogControlRefProps,
  DialogExtraOpts,
  DialogOuterProps,
} from '#/components/Dialog/types'

export const Context = React.createContext<DialogContextProps>({
  close: () => {},
})

export function useDialogContext() {
  return React.useContext(Context)
}

export function useDialogControl<T extends DialogExtraOpts<T> = {}>(
  // @ts-ignore A TS expert could probably figure this one out...
  defaultOpts: T = {},
): DialogOuterProps<T>['control'] {
  const id = React.useId()
  const control = React.useRef<DialogControlRefProps<T>>({
    open: () => {},
    close: () => {},
  })
  const {activeDialogs, openDialogs} = useDialogStateContext()
  const isOpen = openDialogs.includes(id)

  const [options, setOptions] = React.useState<T>(defaultOpts)

  React.useEffect(() => {
    activeDialogs.current.set(id, control)
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      activeDialogs.current.delete(id)
    }
  }, [id, activeDialogs])

  return React.useMemo<DialogOuterProps<T>['control']>(
    () => ({
      id,
      ref: control,
      isOpen,
      open: newOptions => {
        if (newOptions) {
          setOptions(newOptions)
        }
        control.current.open()
      },
      close: cb => {
        control.current.close(cb)
      },
      options,
    }),
    [id, isOpen, options],
  )
}
