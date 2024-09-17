import React from 'react'

import {useGate} from '#/lib/statsig/statsig'
import {logger} from '#/logger'
import {
  Nux,
  useNuxs,
  useRemoveNuxsMutation,
  useUpsertNuxMutation,
} from '#/state/queries/nuxs'
import {useSession} from '#/state/session'
import {useOnboardingState} from '#/state/shell'
import {isSnoozed, snooze, unsnooze} from '#/components/dialogs/nuxs/snoozing'
import {TenMillion} from '#/components/dialogs/nuxs/TenMillion'
import {IS_DEV} from '#/env'

type Context = {
  activeNux: Nux | undefined
  dismissActiveNux: () => void
}

const queuedNuxs: {
  id: Nux
  enabled?: (props: {gate: ReturnType<typeof useGate>}) => boolean
}[] = [
  {
    id: Nux.TenMillionDialog,
  },
]

const Context = React.createContext<Context>({
  activeNux: undefined,
  dismissActiveNux: () => {},
})

export function useNuxDialogContext() {
  return React.useContext(Context)
}

export function NuxDialogs() {
  const {hasSession} = useSession()
  const onboardingState = useOnboardingState()
  return hasSession && !onboardingState.isActive ? <Inner /> : null
}

function Inner() {
  const gate = useGate()
  const {nuxs} = useNuxs()
  const [snoozed, setSnoozed] = React.useState(() => {
    return isSnoozed()
  })
  const [activeNux, setActiveNux] = React.useState<Nux | undefined>()
  const {mutateAsync: upsertNux} = useUpsertNuxMutation()
  const {mutate: removeNuxs} = useRemoveNuxsMutation()

  const snoozeNuxDialog = React.useCallback(() => {
    snooze()
    setSnoozed(true)
  }, [setSnoozed])

  const dismissActiveNux = React.useCallback(() => {
    if (!activeNux) return
    setActiveNux(undefined)
  }, [activeNux, setActiveNux])

  if (IS_DEV && typeof window !== 'undefined') {
    // @ts-ignore
    window.clearNuxDialog = (id: Nux) => {
      if (!IS_DEV || !id) return
      removeNuxs([id])
      unsnooze()
    }
  }

  React.useEffect(() => {
    if (snoozed) return
    if (!nuxs) return

    for (const {id, enabled} of queuedNuxs) {
      const nux = nuxs.find(nux => nux.id === id)

      // check if completed first
      if (nux && nux.completed) continue

      // then check gate (track exposure)
      if (enabled && !enabled({gate})) continue

      // we have a winner
      setActiveNux(id)

      // immediately snooze for a day
      snoozeNuxDialog()

      // immediately update remote data (affects next reload)
      upsertNux({
        id,
        completed: true,
        data: undefined,
      }).catch(e => {
        logger.error(`NUX dialogs: failed to upsert '${id}' NUX`, {
          safeMessage: e.message,
        })
      })

      break
    }
  }, [nuxs, snoozed, snoozeNuxDialog, upsertNux, gate])

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
