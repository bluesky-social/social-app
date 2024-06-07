import React from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['highSaturationEnabled']
type SetContext = (v: persisted.Schema['highSaturationEnabled']) => void

const stateContext = React.createContext<StateContext>(
  persisted.defaults.highSaturationEnabled,
)
const setContext = React.createContext<SetContext>(
  (_: persisted.Schema['highSaturationEnabled']) => {},
)

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState(
    persisted.get('highSaturationEnabled'),
  )

  const setStateWrapped = React.useCallback(
    (highSaturationEnabled: persisted.Schema['highSaturationEnabled']) => {
      setState(highSaturationEnabled)
      persisted.write('highSaturationEnabled', highSaturationEnabled)
    },
    [setState],
  )

  React.useEffect(() => {
    return persisted.onUpdate(() => {
      setState(persisted.get('highSaturationEnabled'))
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

export function useHighSaturationEnabled() {
  return React.useContext(stateContext)
}

export function useSetHighSaturationEnabled() {
  return React.useContext(setContext)
}
