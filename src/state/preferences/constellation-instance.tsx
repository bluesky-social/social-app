import React from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['constellationInstance']
type SetContext = (v: persisted.Schema['constellationInstance']) => void

const stateContext = React.createContext<StateContext>(
  persisted.defaults.constellationInstance,
)
const setContext = React.createContext<SetContext>(
  (_: persisted.Schema['constellationInstance']) => {},
)

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState(
    persisted.get('constellationInstance'),
  )

  const setStateWrapped = React.useCallback(
    (constellationInstance: persisted.Schema['constellationInstance']) => {
      setState(constellationInstance)
      persisted.write('constellationInstance', constellationInstance)
    },
    [setState],
  )

  React.useEffect(() => {
    return persisted.onUpdate(
      'constellationInstance',
      nextConstellationInstance => {
        setState(nextConstellationInstance)
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

export function useConstellationInstance() {
  return (
    React.useContext(stateContext) ?? persisted.defaults.constellationInstance!
  )
}

export function useSetConstellationInstance() {
  return React.useContext(setContext)
}
