import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from 'react'

import {useSession} from '#/state/session'
import {Provider as PortalProvider} from '#/components/PolicyUpdateOverlay/Portal'
import {
  type PolicyUpdateState,
  usePolicyUpdateState,
} from '#/components/PolicyUpdateOverlay/usePolicyUpdateState'
import {ENV} from '#/env'

const Context = createContext<{
  state: PolicyUpdateState
  setIsReadyToShowOverlay: () => void
}>({
  state: {
    completed: true,
    complete: () => {},
  },
  /**
   * Although our data will be ready to go when the app shell mounts, we don't
   * want to show the overlay until we actually render it, which happens after
   * sigin/signup/onboarding in `createNativeStackNavigatorWithAuth`.
   */
  setIsReadyToShowOverlay: () => {},
})
Context.displayName = 'PolicyUpdateOverlayContext'

export function usePolicyUpdateContext() {
  const context = useContext(Context)
  if (!context) {
    throw new Error(
      'usePolicyUpdateContext must be used within a PolicyUpdateProvider',
    )
  }
  return context
}

export function Provider({children}: {children?: ReactNode}) {
  const {hasSession} = useSession()
  const [isReadyToShowOverlay, setIsReadyToShowOverlay] = useState(false)
  const state = usePolicyUpdateState({
    // only enable the policy update overlay in non-test environments
    enabled: isReadyToShowOverlay && hasSession && ENV !== 'e2e',
  })

  const ctx = useMemo(
    () => ({
      state,
      setIsReadyToShowOverlay() {
        if (isReadyToShowOverlay) return
        setIsReadyToShowOverlay(true)
      },
    }),
    [state, isReadyToShowOverlay, setIsReadyToShowOverlay],
  )

  return (
    <PortalProvider>
      <Context.Provider value={ctx}>{children}</Context.Provider>
    </PortalProvider>
  )
}
