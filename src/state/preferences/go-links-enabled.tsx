import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['goLinksEnabled']
type SetContext = (v: persisted.Schema['goLinksEnabled']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.goLinksEnabled,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['goLinksEnabled']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('goLinksEnabled'))

  const setStateWrapped = useCallback(
    (goLinksEnabled: persisted.Schema['goLinksEnabled']) => {
      setState(goLinksEnabled)
      persisted.write('goLinksEnabled', goLinksEnabled)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('goLinksEnabled', nextGoLinksEnabled => {
      setState(nextGoLinksEnabled)
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

export function useGoLinksEnabled() {
  return useContext(stateContext)
}

export function useSetGoLinksEnabled() {
  return useContext(setContext)
}
