import React from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['noDiscoverFallback']
type SetContext = (v: persisted.Schema['noDiscoverFallback']) => void

const stateContext = React.createContext<StateContext>(
  persisted.defaults.noDiscoverFallback,
)
const setContext = React.createContext<SetContext>(
  (_: persisted.Schema['noDiscoverFallback']) => {},
)

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState(persisted.get('noDiscoverFallback'))

  const setStateWrapped = React.useCallback(
    (noDiscoverFallback: persisted.Schema['noDiscoverFallback']) => {
      setState(noDiscoverFallback)
      persisted.write('noDiscoverFallback', noDiscoverFallback)
    },
    [setState],
  )

  React.useEffect(() => {
    return persisted.onUpdate('noDiscoverFallback', nextNoDiscoverFallback => {
      setState(nextNoDiscoverFallback)
    })
  }, [setStateWrapped])

  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={setStateWrapped}>
        {children}
      </setContext.Provider>
    </stateContext.Provider>
  )
}

export function useNoDiscoverFallback() {
  return React.useContext(stateContext)
}

export function useSetNoDiscoverFallback() {
  return React.useContext(setContext)
}
