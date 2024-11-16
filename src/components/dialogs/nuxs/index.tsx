import React from 'react'
import {AppBskyActorDefs} from '@atproto/api'

import {useGate} from '#/lib/statsig/statsig'
import {logger} from '#/logger'
import {
  Nux,
  useNuxs,
  useRemoveNuxsMutation,
  useUpsertNuxMutation,
} from '#/state/queries/nuxs'
import {
  usePreferencesQuery,
  UsePreferencesQueryResponse,
} from '#/state/queries/preferences'
import {useProfileQuery} from '#/state/queries/profile'
import {SessionAccount, useSession} from '#/state/session'
import {useOnboardingState} from '#/state/shell'
/*
 * NUXs
 */
import {isSnoozed, snooze, unsnooze} from '#/components/dialogs/nuxs/snoozing'
import {IS_DEV} from '#/env'

type Context = {
  activeNux: Nux | undefined
  dismissActiveNux: () => void
}

const queuedNuxs: {
  id: Nux
  enabled?: (props: {
    gate: ReturnType<typeof useGate>
    currentAccount: SessionAccount
    currentProfile: AppBskyActorDefs.ProfileViewDetailed
    preferences: UsePreferencesQueryResponse
  }) => boolean
}[] = []

const Context = React.createContext<Context>({
  activeNux: undefined,
  dismissActiveNux: () => {},
})

export function useNuxDialogContext() {
  return React.useContext(Context)
}

export function NuxDialogs() {
  const {currentAccount} = useSession()
  const {data: preferences} = usePreferencesQuery()
  const {data: profile} = useProfileQuery({did: currentAccount?.did})
  const onboardingActive = useOnboardingState().isActive

  const isLoading =
    onboardingActive ||
    !currentAccount ||
    !preferences ||
    !profile ||
    // Profile isn't legit ready until createdAt is a real date.
    !profile.createdAt ||
    profile.createdAt === '0001-01-01T00:00:00.000Z' // TODO: Fix this in AppView.

  return !isLoading ? (
    <Inner
      currentAccount={currentAccount}
      currentProfile={profile}
      preferences={preferences}
    />
  ) : null
}

function Inner({
  currentAccount,
  currentProfile,
  preferences,
}: {
  currentAccount: SessionAccount
  currentProfile: AppBskyActorDefs.ProfileViewDetailed
  preferences: UsePreferencesQueryResponse
}) {
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
      if (nux && nux.completed) {
        continue
      }

      // then check gate (track exposure)
      if (
        enabled &&
        !enabled({gate, currentAccount, currentProfile, preferences})
      ) {
        continue
      }

      logger.debug(`NUX dialogs: activating '${id}' NUX`)

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
  }, [
    nuxs,
    snoozed,
    snoozeNuxDialog,
    upsertNux,
    gate,
    currentAccount,
    currentProfile,
    preferences,
  ])

  const ctx = React.useMemo(() => {
    return {
      activeNux,
      dismissActiveNux,
    }
  }, [activeNux, dismissActiveNux])

  return (
    <Context.Provider value={ctx}>
      {/*For example, activeNux === Nux.NeueTypography && <NeueTypography />*/}
    </Context.Provider>
  )
}
