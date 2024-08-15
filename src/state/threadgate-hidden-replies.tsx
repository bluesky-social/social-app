import React from 'react'

type StateContext = {
  uris: string[]
  recentlyUnhiddenUris: string[]
}
type ApiContext = {
  addHiddenReplyUri: (uri: string) => void
  removeHiddenReplyUri: (uri: string) => void
}

const StateContext = React.createContext<StateContext>({
  uris: [],
  recentlyUnhiddenUris: [],
})

const ApiContext = React.createContext<ApiContext>({
  addHiddenReplyUri: () => {},
  removeHiddenReplyUri: () => {},
})

export function Provider({children}: {children: React.ReactNode}) {
  const [uris, setHiddenReplyUris] = React.useState<string[]>([])
  const [recentlyUnhiddenUris, setRecentlyUnhiddenUris] = React.useState<
    string[]
  >([])

  const stateCtx = React.useMemo(
    () => ({
      uris,
      recentlyUnhiddenUris,
    }),
    [uris, recentlyUnhiddenUris],
  )

  const apiCtx = React.useMemo(
    () => ({
      addHiddenReplyUri(uri: string) {
        setHiddenReplyUris(prev => Array.from(new Set([...prev, uri])))
        setRecentlyUnhiddenUris(prev => prev.filter(u => u !== uri))
      },
      removeHiddenReplyUri(uri: string) {
        setHiddenReplyUris(prev => prev.filter(u => u !== uri))
        setRecentlyUnhiddenUris(prev => Array.from(new Set([...prev, uri])))
      },
    }),
    [setHiddenReplyUris],
  )

  return (
    <ApiContext.Provider value={apiCtx}>
      <StateContext.Provider value={stateCtx}>{children}</StateContext.Provider>
    </ApiContext.Provider>
  )
}

export function useThreadgateHiddenReplyUris() {
  return React.useContext(StateContext)
}

export function useThreadgateHiddenReplyUrisAPI() {
  return React.useContext(ApiContext)
}
