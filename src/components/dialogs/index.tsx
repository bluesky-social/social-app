import React from 'react'

import * as Dialog from '#/components/Dialog'

import {DialogParams as ReportDialogParams} from '#/components/dialogs/ReportDialog'

/**
 * Global dialog context. Name each dialog and specify its parameters.
 */
type Context = {
  report: Dialog.DialogControlWithRefProps<ReportDialogParams>
}

/**
 * Global dialog context.
 */
export const Context = React.createContext<Context>({} as Context)

/**
 * Global dialog context provider.
 */
export function Provider({children}: React.PropsWithChildren<{}>) {
  const report = Dialog.useDialogControl<ReportDialogParams>()
  const ctx = React.useMemo<Context>(
    () => ({
      report,
    }),
    [report],
  )

  return <Context.Provider value={ctx}>{children}</Context.Provider>
}
