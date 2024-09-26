import React from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['largeAltBadgeEnabled']
type SetContext = (v: persisted.Schema['largeAltBadgeEnabled']) => void

const stateContext = React.createContext<StateContext>(
  persisted.defaults.largeAltBadgeEnabled,
)
const setContext = React.createContext<SetContext>(
  (_: persisted.Schema['largeAltBadgeEnabled']) => {},
)

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState(
    persisted.get('largeAltBadgeEnabled'),
  )

  const setStateWrapped = React.useCallback(
    (largeAltBadgeEnabled: persisted.Schema['largeAltBadgeEnabled']) => {
      setState(largeAltBadgeEnabled)
      persisted.write('largeAltBadgeEnabled', largeAltBadgeEnabled)
    },
    [setState],
  )

  React.useEffect(() => {
    return persisted.onUpdate(
      'largeAltBadgeEnabled',
      nextLargeAltBadgeEnabled => {
        setState(nextLargeAltBadgeEnabled)
      },
    )
  }, [setStateWrapped])

  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={setStateWrapped}>
        {children}
      </setContext.Provider>
    </stateContext.Provider>
  )
}

export function useLargeAltBadgeEnabled() {
  return React.useContext(stateContext)
}

export function useSetLargeAltBadgeEnabled() {
  return React.useContext(setContext)
}
