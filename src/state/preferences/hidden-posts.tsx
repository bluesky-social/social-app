import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type SetStateCb = (
  s: persisted.Schema['hiddenPosts'],
) => persisted.Schema['hiddenPosts']
type StateContext = persisted.Schema['hiddenPosts']
type ApiContext = {
  hidePost: ({uri}: {uri: string}) => void
  unhidePost: ({uri}: {uri: string}) => void
}

const stateContext = createContext<StateContext>(persisted.defaults.hiddenPosts)
const apiContext = createContext<ApiContext>({
  hidePost: () => {},
  unhidePost: () => {},
})

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('hiddenPosts'))

  const setStateWrapped = useCallback(
    (fn: SetStateCb) => {
      const s = fn(persisted.get('hiddenPosts'))
      setState(s)
      persisted.write('hiddenPosts', s)
    },
    [setState],
  )

  const api = useMemo(
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

  useEffect(() => {
    return persisted.onUpdate(() => {
      setState(persisted.get('hiddenPosts'))
    })
  }, [setStateWrapped])

  return (
    <stateContext.Provider value={state}>
      <apiContext.Provider value={api}>{children}</apiContext.Provider>
    </stateContext.Provider>
  )
}

export function useHiddenPosts() {
  return useContext(stateContext)
}

export function useHiddenPostsApi() {
  return useContext(apiContext)
}
