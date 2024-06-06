import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = boolean
type SetContext = (v: boolean) => void

const stateContext = createContext<StateContext>(
  Boolean(persisted.defaults.disableAutoplay),
)
const setContext = createContext<SetContext>((_: boolean) => {})

export function Provider({children}: {children: ReactNode}) {
  const [state, setState] = useState(Boolean(persisted.get('disableAutoplay')))

  const setStateWrapped = useCallback(
    (autoplayDisabled: persisted.Schema['disableAutoplay']) => {
      setState(Boolean(autoplayDisabled))
      persisted.write('disableAutoplay', autoplayDisabled)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate(() => {
      setState(Boolean(persisted.get('disableAutoplay')))
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

export const useAutoplayDisabled = () => useContext(stateContext)
export const useSetAutoplayDisabled = () => useContext(setContext)
