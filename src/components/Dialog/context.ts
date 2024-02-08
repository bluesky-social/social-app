import React from 'react'

import {useDialogStateContext} from '#/state/dialogs'
import {
  DialogContextProps,
  DialogControlProps,
  DialogControlWithRefProps,
  DialogParams,
} from '#/components/Dialog/types'

export const Context = React.createContext<DialogContextProps<{}>>({
  params: {},
  close: () => {},
})

export function useDialogContext<Params extends DialogParams>() {
  return React.useContext(Context) as DialogContextProps<Params>
}

export function useDialogControl<
  Params extends DialogParams,
>(): DialogControlWithRefProps<Params> {
  const id = React.useId()
  const control = React.useRef<DialogControlProps<Params>>({
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
    open: (params, options) => control.current.open(params, options),
    close: () => control.current.close(),
  }
}
