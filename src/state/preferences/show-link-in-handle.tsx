import React from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['showLinkInHandle']
type SetContext = (v: persisted.Schema['showLinkInHandle']) => void

const stateContext = React.createContext<StateContext>(
  persisted.defaults.showLinkInHandle,
)
const setContext = React.createContext<SetContext>(
  (_: persisted.Schema['showLinkInHandle']) => {},
)

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState(persisted.get('showLinkInHandle'))

  const setStateWrapped = React.useCallback(
    (showLinkInHandle: persisted.Schema['showLinkInHandle']) => {
      setState(showLinkInHandle)
      persisted.write('showLinkInHandle', showLinkInHandle)
    },
    [setState],
  )

  React.useEffect(() => {
    return persisted.onUpdate('showLinkInHandle', nextShowLinkInHandle => {
      setState(nextShowLinkInHandle)
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

export function useShowLinkInHandle() {
  return React.useContext(stateContext)
}

export function useSetShowLinkInHandle() {
  return React.useContext(setContext)
}
