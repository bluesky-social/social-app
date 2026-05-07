import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['showLinkInHandle']
type SetContext = (v: persisted.Schema['showLinkInHandle']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.showLinkInHandle,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['showLinkInHandle']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('showLinkInHandle'))

  const setStateWrapped = useCallback(
    (showLinkInHandle: persisted.Schema['showLinkInHandle']) => {
      setState(showLinkInHandle)
      persisted.write('showLinkInHandle', showLinkInHandle)
    },
    [setState],
  )

  useEffect(() => {
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
  return useContext(stateContext)
}

export function useSetShowLinkInHandle() {
  return useContext(setContext)
}
