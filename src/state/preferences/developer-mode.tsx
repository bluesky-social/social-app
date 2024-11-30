import React from 'react'

import * as persisted from '#/state/persisted'

type StateContext = boolean
type SetContext = (v: boolean) => void

const stateContext = React.createContext<StateContext>(
  Boolean(persisted.defaults.developerModeEnabled),
)
const setContext = React.createContext<SetContext>((_: boolean) => {})

export function Provider({children}: {children: React.ReactNode}) {
  const [state, setState] = React.useState(
    Boolean(persisted.get('developerModeEnabled')),
  )

  const setStateWrapped = React.useCallback(
    (developerModeEnabled: persisted.Schema['developerModeEnabled']) => {
      setState(Boolean(developerModeEnabled))
      persisted.write('developerModeEnabled', developerModeEnabled)
    },
    [setState],
  )

  React.useEffect(() => {
    return persisted.onUpdate('developerModeEnabled', nextDeveloperModeEnabled => {
      setState(Boolean(nextDeveloperModeEnabled))
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

export const useDeveloperModeEnabled = () => React.useContext(stateContext)
export const useSetDeveloperModeEnabled = () => React.useContext(setContext)
