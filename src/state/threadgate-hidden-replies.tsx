import React from 'react'

type StateContext = {
  uris: string[]
}
type ApiContext = {
  addHiddenReplyUri: (uri: string) => void
  removeHiddenReplyUri: (uri: string) => void
}

const StateContext = React.createContext<StateContext>({
  uris: [],
})

const ApiContext = React.createContext<ApiContext>({
  addHiddenReplyUri: () => {},
  removeHiddenReplyUri: () => {},
})

export function Provider({children}: {children: React.ReactNode}) {
  const [uris, setHiddenReplyUris] = React.useState<string[]>([])

  const stateCtx = React.useMemo(
    () => ({
      uris,
    }),
    [uris],
  )

  const apiCtx = React.useMemo(
    () => ({
      addHiddenReplyUri(uri: string) {
        setHiddenReplyUris(prev => Array.from(new Set([...prev, uri])))
      },
      removeHiddenReplyUri(uri: string) {
        setHiddenReplyUris(prev => prev.filter(u => u !== uri))
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
