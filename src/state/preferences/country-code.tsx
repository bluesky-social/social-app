import React from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['countryCode']
type SetContext = (v: persisted.Schema['countryCode']) => void

const stateContext = React.createContext<StateContext>(
  persisted.defaults.countryCode,
)
const setContext = React.createContext<SetContext>(
  (_: persisted.Schema['countryCode']) => {},
)

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState(persisted.get('countryCode'))

  const setStateWrapped = React.useCallback(
    (countryCode: persisted.Schema['countryCode']) => {
      setState(countryCode)
      persisted.write('countryCode', countryCode)
    },
    [setState],
  )

  React.useEffect(() => {
    return persisted.onUpdate('countryCode', nextCountryCode => {
      setState(nextCountryCode)
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

export function useCountryCode() {
  return React.useContext(stateContext)
}

export function useSetCountryCode() {
  return React.useContext(setContext)
}
