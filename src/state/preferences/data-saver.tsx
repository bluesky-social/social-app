import React from 'react'
import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['dataSaverEnabled']
type SetContext = (v: persisted.Schema['dataSaverEnabled']) => void

const stateContext = React.createContext<StateContext>(
  persisted.defaults.dataSaverEnabled,
)
const setContext = React.createContext<SetContext>(
  (_: persisted.Schema['dataSaverEnabled']) => {},
)

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState(persisted.get('dataSaverEnabled'))

  const setStateWrapped = React.useCallback(
    (dataSaverEnabled: persisted.Schema['dataSaverEnabled']) => {
      setState(dataSaverEnabled)
      persisted.write('dataSaverEnabled', dataSaverEnabled)
    },
    [setState],
  )

  React.useEffect(() => {
    return persisted.onUpdate(() => {
      setState(persisted.get('dataSaverEnabled'))
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

export function useDataSaverEnabled() {
  return React.useContext(stateContext)
}

export function useSetDataSaverEnabled() {
  return React.useContext(setContext)
}
