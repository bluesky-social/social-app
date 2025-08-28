import React from 'react'

import * as persisted from '#/state/persisted'

type StateContext = boolean
type SetContext = (v: boolean) => void

const stateContext = React.createContext<StateContext>(
  Boolean(persisted.defaults.disableSimilarAccounts),
)
stateContext.displayName = 'SimilarAccountsStateContext'
const setContext = React.createContext<SetContext>((_: boolean) => {})
setContext.displayName = 'SimilarAccountsSetContext'

export function Provider({children}: {children: React.ReactNode}) {
  const [state, setState] = React.useState(
    Boolean(persisted.get('disableSimilarAccounts')),
  )

  const setStateWrapped = React.useCallback(
    (similarAccountsDisabled: persisted.Schema['disableSimilarAccounts']) => {
      setState(Boolean(similarAccountsDisabled))
      persisted.write('disableSimilarAccounts', similarAccountsDisabled)
    },
    [setState],
  )

  React.useEffect(() => {
    return persisted.onUpdate(
      'disableSimilarAccounts',
      nextDisableSimilarAccounts => {
        setState(Boolean(nextDisableSimilarAccounts))
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

export const useSimilarAccountsDisabled = () => React.useContext(stateContext)
export const useSetSimilarAccountsDisabled = () => React.useContext(setContext)
