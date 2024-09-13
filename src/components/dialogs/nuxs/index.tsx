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
import {isSnoozed, snooze, unsnooze} from '#/components/dialogs/nuxs/snoozing'
import {TenMillion} from '#/components/dialogs/nuxs/TenMillion'
import {IS_DEV} from '#/env'

type Context = {
  activeNux: Nux | undefined
  dismissActiveNux: () => void
}

/**
 * If we fail to complete a NUX here, it may show again on next reload,
 * or if prefs state updates. If `true`, this fallback ensures that the last
 * shown NUX won't show again, at least for this session.
 *
 * This is temporary, and only needed for the 10Milly dialog rn, since we
 * aren't snoozing that one in device storage.
 */
let __isSnoozedFallback = false

const queuedNuxs: {
  id: Nux
  enabled(props: {gate: ReturnType<typeof useGate>}): boolean
  /**
   * TEMP only intended for use with the 10Milly dialog rn, since there are no
   * other NUX dialogs configured
   */
  unsafe_disableSnooze: boolean
}[] = [
  {
    id: Nux.TenMillionDialog,
    enabled({gate}) {
      return gate('ten_million_dialog')
    },
    unsafe_disableSnooze: true,
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
  return hasSession ? <Inner /> : null
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
    if (__isSnoozedFallback) return
    if (snoozed) return
    if (!nuxs) return

    for (const {id, enabled, unsafe_disableSnooze} of queuedNuxs) {
      const nux = nuxs.find(nux => nux.id === id)

      // check if completed first
      if (nux && nux.completed) continue

      // then check gate (track exposure)
      if (!enabled({gate})) continue

      // we have a winner
      setActiveNux(id)

      /**
       * TEMP only intended for use with the 10Milly dialog rn, since there are no
       * other NUX dialogs configured
       */
      if (!unsafe_disableSnooze) {
        // immediately snooze for a day
        snoozeNuxDialog()
      }

      // immediately update remote data (affects next reload)
      upsertNux({
        id,
        completed: true,
        data: undefined,
      }).catch(e => {
        logger.error(`NUX dialogs: failed to upsert '${id}' NUX`, {
          safeMessage: e.message,
        })
        /*
         * TEMP only intended for use with the 10Milly dialog rn
         */
        if (unsafe_disableSnooze) {
          __isSnoozedFallback = true
        }
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
