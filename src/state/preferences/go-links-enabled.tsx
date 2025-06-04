import React from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['goLinksEnabled']
type SetContext = (v: persisted.Schema['goLinksEnabled']) => void

const stateContext = React.createContext<StateContext>(
  persisted.defaults.goLinksEnabled,
)
const setContext = React.createContext<SetContext>(
  (_: persisted.Schema['goLinksEnabled']) => {},
)

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState(persisted.get('goLinksEnabled'))

  const setStateWrapped = React.useCallback(
    (goLinksEnabled: persisted.Schema['goLinksEnabled']) => {
      setState(goLinksEnabled)
      persisted.write('goLinksEnabled', goLinksEnabled)
    },
    [setState],
  )

  React.useEffect(() => {
    return persisted.onUpdate('goLinksEnabled', nextGoLinksEnabled => {
      setState(nextGoLinksEnabled)
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

export function useGoLinksEnabled() {
  return React.useContext(stateContext)
}

export function useSetGoLinksEnabled() {
  return React.useContext(setContext)
}
