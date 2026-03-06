import React from 'react'

import * as persisted from '#/state/persisted'
import {
  usePreferencesQuery,
  useSetAutoplayDisabledMutation,
} from '#/state/queries/preferences'
import {useSession} from '#/state/session'

type StateContext = boolean
type SetContext = (v: boolean) => void

const stateContext = React.createContext<StateContext>(
  Boolean(persisted.defaults.disableAutoplay),
)
stateContext.displayName = 'AutoplayStateContext'
const setContext = React.createContext<SetContext>((_: boolean) => {})
setContext.displayName = 'AutoplaySetContext'

export function Provider({children}: {children: React.ReactNode}) {
  const {hasSession} = useSession()
  const {data: preferences, isSuccess: prefsLoaded} = usePreferencesQuery()
  const {mutate: setServerAutoplayDisabled} = useSetAutoplayDisabledMutation()

  // Get server preference (undefined if not set or not logged in)
  const serverAutoplayDisabled = preferences?.bskyAppState?.autoplayDisabled

  // Get local preference
  const localAutoplayDisabled = Boolean(persisted.get('disableAutoplay'))

  // Determine the effective state:
  // - If logged in and server has a value, use server value
  // - Otherwise use local storage value
  const effectiveState = React.useMemo(() => {
    if (hasSession && prefsLoaded && serverAutoplayDisabled !== undefined) {
      return serverAutoplayDisabled
    }
    return localAutoplayDisabled
  }, [hasSession, prefsLoaded, serverAutoplayDisabled, localAutoplayDisabled])

  const [state, setState] = React.useState(effectiveState)

  // Sync state when effective state changes
  React.useEffect(() => {
    setState(effectiveState)
  }, [effectiveState])

  // Migration: When user logs in and server has no value, migrate local preference to server
  const hasMigrated = React.useRef(false)
  React.useEffect(() => {
    if (
      hasSession &&
      prefsLoaded &&
      serverAutoplayDisabled === undefined &&
      !hasMigrated.current
    ) {
      hasMigrated.current = true
      // Migrate local preference to server
      if (localAutoplayDisabled !== persisted.defaults.disableAutoplay) {
        setServerAutoplayDisabled({autoplayDisabled: localAutoplayDisabled})
      }
    }
  }, [
    hasSession,
    prefsLoaded,
    serverAutoplayDisabled,
    localAutoplayDisabled,
    setServerAutoplayDisabled,
  ])

  const setStateWrapped = React.useCallback(
    (autoplayDisabled: boolean) => {
      setState(autoplayDisabled)

      // Always write to local storage (for offline/logged-out support)
      persisted.write('disableAutoplay', autoplayDisabled)

      // If logged in, also sync to server
      if (hasSession) {
        setServerAutoplayDisabled({autoplayDisabled})
      }
    },
    [hasSession, setServerAutoplayDisabled],
  )

  // Listen for local storage updates (e.g., from other tabs on web)
  React.useEffect(() => {
    return persisted.onUpdate('disableAutoplay', nextDisableAutoplay => {
      // Only update from local storage if we're not using server prefs
      if (!hasSession || serverAutoplayDisabled === undefined) {
        setState(Boolean(nextDisableAutoplay))
      }
    })
  }, [hasSession, serverAutoplayDisabled])

  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={setStateWrapped}>
        {children}
      </setContext.Provider>
    </stateContext.Provider>
  )
}

export const useAutoplayDisabled = () => React.useContext(stateContext)
export const useSetAutoplayDisabled = () => React.useContext(setContext)
