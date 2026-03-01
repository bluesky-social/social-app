import React from 'react'

import * as persisted from '#/state/persisted'

type StateContext = boolean
type SetContext = (v: boolean) => void

const stateContext = React.createContext<StateContext>(
  Boolean(persisted.defaults.disableAutoplay),
)
stateContext.displayName = 'AutoplayStateContext'
const setContext = React.createContext<SetContext>((_: boolean) => {})
setContext.displayName = 'AutoplaySetContext'

export function Provider({children}: {children: React.ReactNode}) {
  const [state, setState] = React.useState(
    Boolean(persisted.get('disableAutoplay')),
  )

  const setStateWrapped = React.useCallback(
    (autoplayDisabled: persisted.Schema['disableAutoplay']) => {
      setState(Boolean(autoplayDisabled))
      persisted.write('disableAutoplay', autoplayDisabled)
    },
    [setState],
  )

  React.useEffect(() => {
    return persisted.onUpdate('disableAutoplay', nextDisableAutoplay => {
      setState(Boolean(nextDisableAutoplay))
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

export const useAutoplayDisabled = () => React.useContext(stateContext)
export const useSetAutoplayDisabled = () => React.useContext(setContext)
