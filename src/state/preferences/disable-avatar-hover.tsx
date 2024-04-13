import React from 'react'

import * as persisted from '#/state/persisted'

type StateContext = boolean
type SetContext = (v: boolean) => void

const stateContext = React.createContext<StateContext>(
  Boolean(persisted.defaults.disableAvatarHover),
)
const setContext = React.createContext<SetContext>((_: boolean) => {})

export function Provider({children}: {children: React.ReactNode}) {
  const [state, setState] = React.useState(
    Boolean(persisted.get('disableAvatarHover')),
  )

  const setStateWrapped = React.useCallback(
    (disableAvatarHover: persisted.Schema['disableAvatarHover']) => {
      setState(Boolean(disableAvatarHover))
      persisted.write('disableAvatarHover', disableAvatarHover)
    },
    [setState],
  )

  React.useEffect(() => {
    return persisted.onUpdate(() => {
      setState(Boolean(persisted.get('disableAvatarHover')))
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

export const useAvatarHoverDisabled = () => React.useContext(stateContext)
export const useSetAvatarHoverDisabled = () => React.useContext(setContext)
