import React from 'react'
import {AppBskyFeedThreadgate} from '@atproto/api'

type StateContext = {
  uris: Set<string>
  recentlyUnhiddenUris: Set<string>
}
type ApiContext = {
  addHiddenReplyUri: (uri: string) => void
  removeHiddenReplyUri: (uri: string) => void
}

const StateContext = React.createContext<StateContext>({
  uris: new Set(),
  recentlyUnhiddenUris: new Set(),
})

const ApiContext = React.createContext<ApiContext>({
  addHiddenReplyUri: () => {},
  removeHiddenReplyUri: () => {},
})

export function Provider({children}: {children: React.ReactNode}) {
  const [uris, setHiddenReplyUris] = React.useState<Set<string>>(new Set())
  const [recentlyUnhiddenUris, setRecentlyUnhiddenUris] = React.useState<
    Set<string>
  >(new Set())

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
        setHiddenReplyUris(prev => new Set(prev.add(uri)))
        setRecentlyUnhiddenUris(prev => {
          prev.delete(uri)
          return new Set(prev)
        })
      },
      removeHiddenReplyUri(uri: string) {
        setHiddenReplyUris(prev => {
          prev.delete(uri)
          return new Set(prev)
        })
        setRecentlyUnhiddenUris(prev => new Set(prev.add(uri)))
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

export function useMergedThreadgateHiddenReplies({
  threadgateRecord,
}: {
  threadgateRecord?: AppBskyFeedThreadgate.Record
}) {
  const {uris, recentlyUnhiddenUris} = useThreadgateHiddenReplyUris()
  return React.useMemo(() => {
    const set = new Set([...(threadgateRecord?.hiddenReplies || []), ...uris])
    for (const uri of recentlyUnhiddenUris) {
      set.delete(uri)
    }
    return set
  }, [uris, recentlyUnhiddenUris, threadgateRecord])
}
