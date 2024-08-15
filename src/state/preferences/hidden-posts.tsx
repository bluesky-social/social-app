import React from 'react'

import * as persisted from '#/state/persisted'

type SetStateCb = (
  s: persisted.Schema['hiddenPosts'],
) => persisted.Schema['hiddenPosts']
type StateContext = persisted.Schema['hiddenPosts']
type ApiContext = {
  hidePost: ({uri}: {uri: string}) => void
  unhidePost: ({uri}: {uri: string}) => void
}

const stateContext = React.createContext<StateContext>(
  persisted.defaults.hiddenPosts,
)
const apiContext = React.createContext<ApiContext>({
  hidePost: () => {},
  unhidePost: () => {},
})

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState(persisted.get('hiddenPosts'))

  const setStateWrapped = React.useCallback(
    (fn: SetStateCb) => {
      const s = fn(persisted.get('hiddenPosts'))
      setState(s)
      persisted.write('hiddenPosts', s)
    },
    [setState],
  )

  const api = React.useMemo(
    () => ({
      hidePost: ({uri}: {uri: string}) => {
        setStateWrapped(s => [...(s || []), uri])
      },
      unhidePost: ({uri}: {uri: string}) => {
        setStateWrapped(s => (s || []).filter(u => u !== uri))
      },
    }),
    [setStateWrapped],
  )

  React.useEffect(() => {
    return persisted.onUpdate('hiddenPosts', nextHiddenPosts => {
      setState(nextHiddenPosts)
    })
  }, [setStateWrapped])

  return (
    <stateContext.Provider value={state}>
      <apiContext.Provider value={api}>{children}</apiContext.Provider>
    </stateContext.Provider>
  )
}

export function useHiddenPosts() {
  return React.useContext(stateContext)
}

export function useHiddenPostsApi() {
  return React.useContext(apiContext)
}
