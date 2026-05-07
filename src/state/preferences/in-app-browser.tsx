import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['useInAppBrowser']
type SetContext = (v: persisted.Schema['useInAppBrowser']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.useInAppBrowser,
)
stateContext.displayName = 'InAppBrowserStateContext'
const setContext = createContext<SetContext>(
  (_: persisted.Schema['useInAppBrowser']) => {},
)
setContext.displayName = 'InAppBrowserSetContext'

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('useInAppBrowser'))

  const setStateWrapped = useCallback(
    (inAppBrowser: persisted.Schema['useInAppBrowser']) => {
      setState(inAppBrowser)
      persisted.write('useInAppBrowser', inAppBrowser)
    },
    [setState],
  )

  useEffect(() => {
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
  return useContext(stateContext)
}

export function useSetInAppBrowser() {
  return useContext(setContext)
}
