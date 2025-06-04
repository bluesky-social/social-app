import React from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['hideFollowNotifications']
type SetContext = (v: persisted.Schema['hideFollowNotifications']) => void

const stateContext = React.createContext<StateContext>(
  persisted.defaults.hideFollowNotifications,
)
const setContext = React.createContext<SetContext>(
  (_: persisted.Schema['hideFollowNotifications']) => {},
)

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState(
    persisted.get('hideFollowNotifications'),
  )

  const setStateWrapped = React.useCallback(
    (hideFollowNotifications: persisted.Schema['hideFollowNotifications']) => {
      setState(hideFollowNotifications)
      persisted.write('hideFollowNotifications', hideFollowNotifications)
    },
    [setState],
  )

  React.useEffect(() => {
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
  return React.useContext(stateContext)
}

export function useSetHideFollowNotifications() {
  return React.useContext(setContext)
}
