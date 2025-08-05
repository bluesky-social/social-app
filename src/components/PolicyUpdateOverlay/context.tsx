import {createContext, type ReactNode, useContext} from 'react'

import {Provider as PortalProvider} from '#/components/PolicyUpdateOverlay/Portal'
import {
  type PolicyUpdateState,
  usePolicyUpdateState,
} from '#/components/PolicyUpdateOverlay/usePolicyUpdateState'

const Context = createContext<PolicyUpdateState>({
  completed: true,
  complete: () => {},
})

export function usePolicyUpdateStateContext() {
  const context = useContext(Context)
  if (!context) {
    throw new Error(
      'usePolicyUpdateStateContext must be used within a PolicyUpdateProvider',
    )
  }
  return context
}

export function Provider({children}: {children?: ReactNode}) {
  const state = usePolicyUpdateState()

  return (
    <PortalProvider>
      <Context.Provider value={state}>{children}</Context.Provider>
    </PortalProvider>
  )
}
