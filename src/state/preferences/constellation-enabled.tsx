import React from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['constellationEnabled']
type SetContext = (v: persisted.Schema['constellationEnabled']) => void

const stateContext = React.createContext<StateContext>(
  persisted.defaults.constellationEnabled,
)
const setContext = React.createContext<SetContext>(
  (_: persisted.Schema['constellationEnabled']) => {},
)

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState(
    persisted.get('constellationEnabled'),
  )

  const setStateWrapped = React.useCallback(
    (constellationEnabled: persisted.Schema['constellationEnabled']) => {
      setState(constellationEnabled)
      persisted.write('constellationEnabled', constellationEnabled)
    },
    [setState],
  )

  React.useEffect(() => {
    return persisted.onUpdate(
      'constellationEnabled',
      nextConstellationEnabled => {
        setState(nextConstellationEnabled)
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

export function useConstellationEnabled() {
  return React.useContext(stateContext)
}

export function useSetConstellationEnabled() {
  return React.useContext(setContext)
}
