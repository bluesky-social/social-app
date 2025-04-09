import React from 'react'

import * as persisted from '#/state/persisted'

type StateContext = boolean
type SetContext = (v: boolean) => void

const stateContext = React.createContext<StateContext>(
  Boolean(persisted.defaults.shareByDid),
)
const setContext = React.createContext<SetContext>((_: boolean) => {})

export function Provider({children}: {children: React.ReactNode}) {
  const [state, setState] = React.useState(Boolean(persisted.get('shareByDid')))

  const setStateWrapped = React.useCallback(
    (shareByDid: persisted.Schema['shareByDid']) => {
      setState(Boolean(shareByDid))
      persisted.write('shareByDid', shareByDid)
    },
    [setState],
  )

  React.useEffect(() => {
    return persisted.onUpdate('shareByDid', nextshareByDid => {
      setState(Boolean(nextshareByDid))
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

export const useShareByDid = () => React.useContext(stateContext)
export const useSetShareByDid = () => React.useContext(setContext)
