import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['noDiscoverFallback']
type SetContext = (v: persisted.Schema['noDiscoverFallback']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.noDiscoverFallback,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['noDiscoverFallback']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('noDiscoverFallback'))

  const setStateWrapped = useCallback(
    (noDiscoverFallback: persisted.Schema['noDiscoverFallback']) => {
      setState(noDiscoverFallback)
      persisted.write('noDiscoverFallback', noDiscoverFallback)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('noDiscoverFallback', nextNoDiscoverFallback => {
      setState(nextNoDiscoverFallback)
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

export function useNoDiscoverFallback() {
  return useContext(stateContext)
}

export function useSetNoDiscoverFallback() {
  return useContext(setContext)
}
