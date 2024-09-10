import React from 'react'

import * as Dialog from '#/components/Dialog'

import {TenMillion} from '#/components/dialogs/nudges/TenMillion'

type Context = {
  controls: {
    tenMillion: Dialog.DialogOuterProps['control']
  }
}

const Context = React.createContext<Context>({
  // @ts-ignore
  controls: {}
})

export function useContext() {
  return React.useContext(Context)
}

let SHOWN = false

export function NudgeDialogs() {
  const tenMillion = Dialog.useDialogControl()

  const ctx = React.useMemo(() => {
    return {
      controls: {
        tenMillion
      }
    }
  }, [tenMillion])

  React.useEffect(() => {
    const t = setTimeout(() => {
      if (!SHOWN) {
        SHOWN = true
        ctx.controls.tenMillion.open()
      }
    }, 2e3)

    return () => {
      clearTimeout(t)
    }
  }, [ctx])

  return (
    <Context.Provider value={ctx}>
      <TenMillion />
    </Context.Provider>
  )
}
