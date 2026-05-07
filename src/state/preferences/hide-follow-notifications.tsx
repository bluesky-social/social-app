import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['hideFollowNotifications']
type SetContext = (v: persisted.Schema['hideFollowNotifications']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.hideFollowNotifications,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['hideFollowNotifications']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('hideFollowNotifications'))

  const setStateWrapped = useCallback(
    (hideFollowNotifications: persisted.Schema['hideFollowNotifications']) => {
      setState(hideFollowNotifications)
      persisted.write('hideFollowNotifications', hideFollowNotifications)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate(
      'hideFollowNotifications',
      nextHideFollowNotifications => {
        setState(nextHideFollowNotifications)
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

export function useHideFollowNotifications() {
  return useContext(stateContext)
}

export function useSetHideFollowNotifications() {
  return useContext(setContext)
}
