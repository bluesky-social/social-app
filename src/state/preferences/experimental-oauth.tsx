import React from 'react'

import * as persisted from '#/state/persisted'

type StateContext = boolean
type SetContext = (v: boolean) => void

const stateContext = React.createContext<StateContext>(
  Boolean(persisted.defaults.experimentalOauthEnabled),
)
const setContext = React.createContext<SetContext>((_: boolean) => {})

export function Provider({children}: {children: React.ReactNode}) {
  const [state, setState] = React.useState(
    Boolean(persisted.get('experimentalOauthEnabled')),
  )

  const setStateWrapped = React.useCallback(
    (
      experimentalOauthEnabled: persisted.Schema['experimentalOauthEnabled'],
    ) => {
      setState(Boolean(experimentalOauthEnabled))
      persisted.write('experimentalOauthEnabled', experimentalOauthEnabled)
    },
    [setState],
  )

  React.useEffect(() => {
    return persisted.onUpdate(
      'experimentalOauthEnabled',
      experimentalOauthEnabled => {
        setState(Boolean(experimentalOauthEnabled))
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

export const useExperimentalOauthEnabled = () => React.useContext(stateContext)
export const useSetExperimentalOauthEnabled = () => React.useContext(setContext)
