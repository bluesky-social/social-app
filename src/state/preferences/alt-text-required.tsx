import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['requireAltTextEnabled']
type SetContext = (v: persisted.Schema['requireAltTextEnabled']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.requireAltTextEnabled,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['requireAltTextEnabled']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('requireAltTextEnabled'))

  const setStateWrapped = useCallback(
    (requireAltTextEnabled: persisted.Schema['requireAltTextEnabled']) => {
      setState(requireAltTextEnabled)
      persisted.write('requireAltTextEnabled', requireAltTextEnabled)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate(() => {
      setState(persisted.get('requireAltTextEnabled'))
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

export function useRequireAltTextEnabled() {
  return useContext(stateContext)
}

export function useSetRequireAltTextEnabled() {
  return useContext(setContext)
}
