import React from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['noAppLabelers']
type SetContext = (v: persisted.Schema['noAppLabelers']) => void

const stateContext = React.createContext<StateContext>(
  persisted.defaults.noAppLabelers,
)
const setContext = React.createContext<SetContext>(
  (_: persisted.Schema['noAppLabelers']) => {},
)

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState(persisted.get('noAppLabelers'))

  const setStateWrapped = React.useCallback(
    (noAppLabelers: persisted.Schema['noAppLabelers']) => {
      setState(noAppLabelers)
      persisted.write('noAppLabelers', noAppLabelers)
    },
    [setState],
  )

  React.useEffect(() => {
    return persisted.onUpdate('noAppLabelers', nextNoAppLabelers => {
      setState(nextNoAppLabelers)
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

export function useNoAppLabelers() {
  return React.useContext(stateContext)
}

export function useSetNoAppLabelers() {
  return React.useContext(setContext)
}

export function getNoAppLabelers() {
  return persisted.get('noAppLabelers') || persisted.defaults.noAppLabelers!
}
