import React from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['directFetchRecords']
type SetContext = (v: persisted.Schema['directFetchRecords']) => void

const stateContext = React.createContext<StateContext>(
  persisted.defaults.directFetchRecords,
)
const setContext = React.createContext<SetContext>(
  (_: persisted.Schema['directFetchRecords']) => {},
)

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState(persisted.get('directFetchRecords'))

  const setStateWrapped = React.useCallback(
    (directFetchRecords: persisted.Schema['directFetchRecords']) => {
      setState(directFetchRecords)
      persisted.write('directFetchRecords', directFetchRecords)
    },
    [setState],
  )

  React.useEffect(() => {
    return persisted.onUpdate('directFetchRecords', nextDirectFetchRecords => {
      setState(nextDirectFetchRecords)
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

export function useDirectFetchRecords() {
  return React.useContext(stateContext)
}

export function useSetDirectFetchRecords() {
  return React.useContext(setContext)
}
