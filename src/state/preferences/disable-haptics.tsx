import React from 'react'

import * as persisted from '#/state/persisted'

type StateContext = boolean
type SetContext = (v: boolean) => void

const stateContext = React.createContext<StateContext>(
  Boolean(persisted.defaults.disableHaptics),
)
const setContext = React.createContext<SetContext>((_: boolean) => {})

export function Provider({children}: {children: React.ReactNode}) {
  const [state, setState] = React.useState(
    Boolean(persisted.get('disableHaptics')),
  )

  const setStateWrapped = React.useCallback(
    (hapticsEnabled: persisted.Schema['disableHaptics']) => {
      setState(Boolean(hapticsEnabled))
      persisted.write('disableHaptics', hapticsEnabled)
    },
    [setState],
  )

  React.useEffect(() => {
    return persisted.onUpdate('disableHaptics', nextDisableHaptics => {
      setState(Boolean(nextDisableHaptics))
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

export const useHapticsDisabled = () => React.useContext(stateContext)
export const useSetHapticsDisabled = () => React.useContext(setContext)
