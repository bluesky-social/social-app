import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = boolean
type SetContext = (v: boolean) => void

const stateContext = createContext<StateContext>(
  Boolean(persisted.defaults.disableHaptics),
)
stateContext.displayName = 'DisableHapticsStateContext'
const setContext = createContext<SetContext>((_: boolean) => {})
setContext.displayName = 'DisableHapticsSetContext'

export function Provider({children}: {children: React.ReactNode}) {
  const [state, setState] = useState(Boolean(persisted.get('disableHaptics')))

  const setStateWrapped = useCallback(
    (hapticsEnabled: persisted.Schema['disableHaptics']) => {
      setState(Boolean(hapticsEnabled))
      persisted.write('disableHaptics', hapticsEnabled)
    },
    [setState],
  )

  useEffect(() => {
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

export const useHapticsDisabled = () => useContext(stateContext)
export const useSetHapticsDisabled = () => useContext(setContext)
