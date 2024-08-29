import React from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['requireAltTextEnabled']
type SetContext = (v: persisted.Schema['requireAltTextEnabled']) => void

const stateContext = React.createContext<StateContext>(
  persisted.defaults.requireAltTextEnabled,
)
const setContext = React.createContext<SetContext>(
  (_: persisted.Schema['requireAltTextEnabled']) => {},
)

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState(
    persisted.get('requireAltTextEnabled'),
  )

  const setStateWrapped = React.useCallback(
    (requireAltTextEnabled: persisted.Schema['requireAltTextEnabled']) => {
      setState(requireAltTextEnabled)
      persisted.write('requireAltTextEnabled', requireAltTextEnabled)
    },
    [setState],
  )

  React.useEffect(() => {
    return persisted.onUpdate(
      'requireAltTextEnabled',
      nextRequireAltTextEnabled => {
        setState(nextRequireAltTextEnabled)
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

export function useRequireAltTextEnabled() {
  return React.useContext(stateContext)
}

export function useSetRequireAltTextEnabled() {
  return React.useContext(setContext)
}
