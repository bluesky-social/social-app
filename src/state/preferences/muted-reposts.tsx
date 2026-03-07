import React from 'react'

import * as persisted from '#/state/persisted'

type SetStateCb = (
  s: persisted.Schema['mutedReposts'],
) => persisted.Schema['mutedReposts']
type StateContext = persisted.Schema['mutedReposts']
type ApiContext = {
  muteReposts: ({did}: {did: string}) => void
  unmuteReposts: ({did}: {did: string}) => void
  isMutedReposts: ({did}: {did: string}) => boolean
}

const stateContext = React.createContext<StateContext>(
  persisted.defaults.mutedReposts,
)
stateContext.displayName = 'MutedRepostsStateContext'
const apiContext = React.createContext<ApiContext>({
  muteReposts: () => {},
  unmuteReposts: () => {},
  isMutedReposts: () => false,
})
apiContext.displayName = 'MutedRepostsApiContext'

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState(persisted.get('mutedReposts'))

  const setStateWrapped = React.useCallback(
    (fn: SetStateCb) => {
      const s = fn(persisted.get('mutedReposts'))
      setState(s)
      persisted.write('mutedReposts', s)
    },
    [setState],
  )

  const api = React.useMemo(
    () => ({
      muteReposts: ({did}: {did: string}) => {
        setStateWrapped(s => [...(s || []), did])
      },
      unmuteReposts: ({did}: {did: string}) => {
        setStateWrapped(s => (s || []).filter(d => d !== did))
      },
      isMutedReposts: ({did}: {did: string}) => {
        return (state || []).includes(did)
      },
    }),
    [state, setStateWrapped],
  )

  React.useEffect(() => {
    return persisted.onUpdate('mutedReposts', nextMutedReposts => {
      setState(nextMutedReposts)
    })
  }, [setStateWrapped])

  return (
    <stateContext.Provider value={state}>
      <apiContext.Provider value={api}>{children}</apiContext.Provider>
    </stateContext.Provider>
  )
}

export function useMutedReposts() {
  return React.useContext(stateContext)
}

export function useMutedRepostsApi() {
  return React.useContext(apiContext)
}
