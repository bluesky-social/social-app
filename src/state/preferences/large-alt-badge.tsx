import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['largeAltBadgeEnabled']
type SetContext = (v: persisted.Schema['largeAltBadgeEnabled']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.largeAltBadgeEnabled,
)
stateContext.displayName = 'LargeAltBadgeStateContext'
const setContext = createContext<SetContext>(
  (_: persisted.Schema['largeAltBadgeEnabled']) => {},
)
setContext.displayName = 'LargeAltBadgeSetContext'

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('largeAltBadgeEnabled'))

  const setStateWrapped = useCallback(
    (largeAltBadgeEnabled: persisted.Schema['largeAltBadgeEnabled']) => {
      setState(largeAltBadgeEnabled)
      persisted.write('largeAltBadgeEnabled', largeAltBadgeEnabled)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate(
      'largeAltBadgeEnabled',
      nextLargeAltBadgeEnabled => {
        setState(nextLargeAltBadgeEnabled)
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

export function useLargeAltBadgeEnabled() {
  return useContext(stateContext)
}

export function useSetLargeAltBadgeEnabled() {
  return useContext(setContext)
}
