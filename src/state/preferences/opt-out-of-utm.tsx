import React from 'react'

import * as persisted from '#/state/persisted'

type StateContext = boolean
type SetContext = (v: boolean) => void

const stateContext = React.createContext<StateContext>(
  Boolean(persisted.defaults.optOutOfUtm),
)
const setContext = React.createContext<SetContext>((_: boolean) => {})

export function Provider({children}: {children: React.ReactNode}) {
  const [state, setState] = React.useState(
    Boolean(persisted.get('optOutOfUtm')),
  )

  const setStateWrapped = React.useCallback(
    (optOutOfUtm: persisted.Schema['optOutOfUtm']) => {
      setState(Boolean(optOutOfUtm))
      persisted.write('optOutOfUtm', optOutOfUtm)
    },
    [setState],
  )

  React.useEffect(() => {
    return persisted.onUpdate('optOutOfUtm', nextOptOutOfUtm => {
      setState(Boolean(nextOptOutOfUtm))
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

export const useOptOutOfUtm = () => React.useContext(stateContext)
export const useSetOptOutOfUtm = () => React.useContext(setContext)
