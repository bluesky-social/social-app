import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['noAppLabelers']
type SetContext = (v: persisted.Schema['noAppLabelers']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.noAppLabelers,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['noAppLabelers']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('noAppLabelers'))

  const setStateWrapped = useCallback(
    (noAppLabelers: persisted.Schema['noAppLabelers']) => {
      setState(noAppLabelers)
      persisted.write('noAppLabelers', noAppLabelers)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('noAppLabelers', nextNoAppLabelers => {
      setState(nextNoAppLabelers)
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

export function useNoAppLabelers() {
  return useContext(stateContext)
}

export function useSetNoAppLabelers() {
  return useContext(setContext)
}

export function getNoAppLabelers() {
  return persisted.get('noAppLabelers') || persisted.defaults.noAppLabelers!
}
