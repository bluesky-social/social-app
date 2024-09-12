import React from 'react'

import {Nux, useNuxs, useUpsertNuxMutation} from '#/state/queries/nuxs'
import {useSession} from '#/state/session'
import {isSnoozed, snooze} from '#/components/dialogs/nuxs/snoozing'
import {TenMillion} from '#/components/dialogs/nuxs/TenMillion'

type Context = {
  activeNux: Nux | undefined
  dismissActiveNux: () => void
}

const queuedNuxs = [Nux.TenMillionDialog]

const Context = React.createContext<Context>({
  activeNux: undefined,
  dismissActiveNux: () => {},
})

export function useNuxDialogContext() {
  return React.useContext(Context)
}

export function NuxDialogs() {
  const {hasSession} = useSession()
  return hasSession ? <Inner /> : null
}

function Inner() {
  const {nuxs} = useNuxs()
  const [snoozed, setSnoozed] = React.useState(() => {
    return isSnoozed()
  })
  const [activeNux, setActiveNux] = React.useState<Nux | undefined>()
  const {mutate: upsertNux} = useUpsertNuxMutation()

  const snoozeNuxDialog = React.useCallback(() => {
    snooze()
    setSnoozed(true)
  }, [setSnoozed])

  const dismissActiveNux = React.useCallback(() => {
    setActiveNux(undefined)
    upsertNux({
      id: activeNux!,
      completed: true,
      data: undefined,
    })
  }, [activeNux, setActiveNux, upsertNux])

  React.useEffect(() => {
    if (snoozed) return
    if (!nuxs) return

    for (const id of queuedNuxs) {
      const nux = nuxs.find(nux => nux.id === id)

      if (nux && nux.completed) continue

      setActiveNux(id)
      // snooze immediately upon enabling
      snoozeNuxDialog()

      break
    }
  }, [nuxs, snoozed, snoozeNuxDialog])

  const ctx = React.useMemo(() => {
    return {
      activeNux,
      dismissActiveNux,
    }
  }, [activeNux, dismissActiveNux])

  return (
    <Context.Provider value={ctx}>
      {activeNux === Nux.TenMillionDialog && <TenMillion />}
    </Context.Provider>
  )
}
