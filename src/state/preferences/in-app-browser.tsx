import React from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['useInAppBrowser']
type SetContext = (v: persisted.Schema['useInAppBrowser']) => void

const stateContext = React.createContext<StateContext>(
  persisted.defaults.useInAppBrowser,
)
const setContext = React.createContext<SetContext>(
  (_: persisted.Schema['useInAppBrowser']) => {},
)

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState(persisted.get('useInAppBrowser'))

  const setStateWrapped = React.useCallback(
    (inAppBrowser: persisted.Schema['useInAppBrowser']) => {
      setState(inAppBrowser)
      persisted.write('useInAppBrowser', inAppBrowser)
    },
    [setState],
  )

  React.useEffect(() => {
    return persisted.onUpdate('useInAppBrowser', nextUseInAppBrowser => {
      setState(nextUseInAppBrowser)
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

export function useInAppBrowser() {
  return React.useContext(stateContext)
}

export function useSetInAppBrowser() {
  return React.useContext(setContext)
}
