import {
  createContext,
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
stateContext.displayName = 'AltTextRequiredStateContext'
const setContext = createContext<SetContext>(
  (_: persisted.Schema['requireAltTextEnabled']) => {},
)
setContext.displayName = 'AltTextRequiredSetContext'

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('requireAltTextEnabled'))

  const setStateWrapped = useCallback(
    (requireAltTextEnabled: persisted.Schema['requireAltTextEnabled']) => {
      setState(requireAltTextEnabled)
      persisted.write('requireAltTextEnabled', requireAltTextEnabled)
    },
    [setState],
  )

  useEffect(() => {
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
  return useContext(stateContext)
}

export function useSetRequireAltTextEnabled() {
  return useContext(setContext)
}
