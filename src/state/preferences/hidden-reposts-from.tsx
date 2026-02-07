import React from 'react'

import * as persisted from '#/state/persisted'

export const MAX_HIDDEN_REPOST_ACCOUNTS = 200

type SetStateCb = (
  s: persisted.Schema['hiddenRepostsFrom'],
) => persisted.Schema['hiddenRepostsFrom']
type StateContext = persisted.Schema['hiddenRepostsFrom']
type ApiContext = {
  hideRepostsFrom: ({did}: {did: string}) => boolean
  unhideRepostsFrom: ({did}: {did: string}) => void
}

const stateContext = React.createContext<StateContext>(
  persisted.defaults.hiddenRepostsFrom,
)
stateContext.displayName = 'HiddenRepostsFromStateContext'
const apiContext = React.createContext<ApiContext>({
  hideRepostsFrom: () => false,
  unhideRepostsFrom: () => {},
})
apiContext.displayName = 'HiddenRepostsFromApiContext'

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState(
    persisted.get('hiddenRepostsFrom'),
  )

  const setStateWrapped = React.useCallback(
    (fn: SetStateCb) => {
      const s = fn(persisted.get('hiddenRepostsFrom'))
      setState(s)
      persisted.write('hiddenRepostsFrom', s)
    },
    [setState],
  )

  const api = React.useMemo(
    () => ({
      hideRepostsFrom: ({did}: {did: string}): boolean => {
        const current = persisted.get('hiddenRepostsFrom') || []
        if (current.length >= MAX_HIDDEN_REPOST_ACCOUNTS) {
          return false
        }
        setStateWrapped(s => [...(s || []), did])
        return true
      },
      unhideRepostsFrom: ({did}: {did: string}) => {
        setStateWrapped(s => (s || []).filter(d => d !== did))
      },
    }),
    [setStateWrapped],
  )

  React.useEffect(() => {
    return persisted.onUpdate('hiddenRepostsFrom', nextHiddenRepostsFrom => {
      setState(nextHiddenRepostsFrom)
    })
  }, [setStateWrapped])

  return (
    <stateContext.Provider value={state}>
      <apiContext.Provider value={api}>{children}</apiContext.Provider>
    </stateContext.Provider>
  )
}

export function useHiddenRepostsFrom() {
  return React.useContext(stateContext)
}

export function useHiddenRepostsFromApi() {
  return React.useContext(apiContext)
}
