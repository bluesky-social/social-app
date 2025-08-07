import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from 'react'

import {Provider as PortalProvider} from '#/components/PolicyUpdateOverlay/Portal'
import {
  type PolicyUpdateState,
  usePolicyUpdateState,
} from '#/components/PolicyUpdateOverlay/usePolicyUpdateState'

const Context = createContext<{
  state: PolicyUpdateState
  setIsReadyToShowOverlay: () => void
}>({
  state: {
    completed: true,
    complete: () => {},
  },
  setIsReadyToShowOverlay: () => {},
})

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
  const [isReadyToShowOverlay, setIsReadyToShowOverlay] = useState(false)
  const state = usePolicyUpdateState({
    // only enable the policy update overlay in non-test environments
    enabled: isReadyToShowOverlay && process.env.NODE_ENV !== 'test',
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
