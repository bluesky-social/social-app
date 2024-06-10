import React from 'react'

import * as persisted from '#/state/persisted'

type StateContext = boolean
type SetContext = (v: boolean) => void

const stateContext = React.createContext<StateContext>(
  Boolean(persisted.defaults.disableNativeTranslation),
)
const setContext = React.createContext<SetContext>((_: boolean) => {})

export function Provider({children}: {children: React.ReactNode}) {
  const [state, setState] = React.useState(
    Boolean(persisted.get('disableNativeTranslation')),
  )

  const setStateWrapped = React.useCallback(
    (
      nativeTranslationEnabled: persisted.Schema['disableNativeTranslation'],
    ) => {
      setState(Boolean(nativeTranslationEnabled))
      persisted.write('disableNativeTranslation', nativeTranslationEnabled)
    },
    [setState],
  )

  React.useEffect(() => {
    return persisted.onUpdate(() => {
      setState(Boolean(persisted.get('disableNativeTranslation')))
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

export const useNativeTranslationDisabled = () => React.useContext(stateContext)
export const useSetNativeTranslationDisabled = () =>
  React.useContext(setContext)
