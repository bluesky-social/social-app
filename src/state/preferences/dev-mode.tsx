import React from 'react'

import * as persisted from '#/state/persisted'

type StateContext = boolean
type SetContext = (v: boolean) => void

const stateContext = React.createContext<StateContext>(
  Boolean(persisted.defaults.devMode),
)
const setContext = React.createContext<SetContext>((_: boolean) => {})

export function Provider({children}: {children: React.ReactNode}) {
  const [state, setState] = React.useState(Boolean(persisted.get('devMode')))

  const setStateWrapped = React.useCallback(
    (devModeEnabled: persisted.Schema['devMode']) => {
      setState(Boolean(devModeEnabled))
      persisted.write('devMode', devModeEnabled)
    },
    [setState],
  )

  React.useEffect(() => {
    return persisted.onUpdate('devMode', nextDevModeEnabled => {
      setState(Boolean(nextDevModeEnabled))
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

export const useDevModeEnabled = () => React.useContext(stateContext)

export const useSetDevModeEnabled = () => React.useContext(setContext)
