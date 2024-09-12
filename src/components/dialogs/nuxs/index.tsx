import React from 'react'

import {useSession} from '#/state/session'
import * as Dialog from '#/components/Dialog'
import {TenMillion} from '#/components/dialogs/nuxs/TenMillion'

type Context = {
  controls: {
    tenMillion: Dialog.DialogOuterProps['control']
  }
}

const Context = React.createContext<Context>({
  // @ts-ignore
  controls: {},
})

export function useContext() {
  return React.useContext(Context)
}

let SHOWN = false

export function NuxDialogs() {
  const {hasSession} = useSession()
  const tenMillion = Dialog.useDialogControl()

  const ctx = React.useMemo(() => {
    return {
      controls: {
        tenMillion,
      },
    }
  }, [tenMillion])

  React.useEffect(() => {
    if (!hasSession) return

    const t = setTimeout(() => {
      if (!SHOWN) {
        SHOWN = true
        ctx.controls.tenMillion.open()
      }
    }, 2e3)

    return () => {
      clearTimeout(t)
    }
  }, [ctx, hasSession])

  return (
    <Context.Provider value={ctx}>
      <TenMillion />
    </Context.Provider>
  )
}
