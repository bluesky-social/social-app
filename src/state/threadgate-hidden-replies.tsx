import {createContext, useCallback, useContext, useMemo, useState} from 'react'
import {type AppBskyFeedThreadgate} from '@atproto/api'

type StateContext = {
  uris: Set<string>
  recentlyUnhiddenUris: Set<string>
}
type ApiContext = {
  addHiddenReplyUri: (uri: string) => void
  removeHiddenReplyUri: (uri: string) => void
}

const StateContext = createContext<StateContext>({
  uris: new Set(),
  recentlyUnhiddenUris: new Set(),
})
StateContext.displayName = 'ThreadgateHiddenRepliesStateContext'

const ApiContext = createContext<ApiContext>({
  addHiddenReplyUri: () => {},
  removeHiddenReplyUri: () => {},
})
ApiContext.displayName = 'ThreadgateHiddenRepliesApiContext'

export function Provider({children}: {children: React.ReactNode}) {
  const [uris, setHiddenReplyUris] = useState<Set<string>>(new Set())
  const [recentlyUnhiddenUris, setRecentlyUnhiddenUris] = useState<Set<string>>(
    new Set(),
  )

  const stateCtx = useMemo(
    () => ({
      uris,
      recentlyUnhiddenUris,
    }),
    [uris, recentlyUnhiddenUris],
  )

  const apiCtx = useMemo(
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
  return useContext(StateContext)
}

export function useThreadgateHiddenReplyUrisAPI() {
  return useContext(ApiContext)
}

export function useMergedThreadgateHiddenReplies({
  threadgateRecord,
}: {
  threadgateRecord?: AppBskyFeedThreadgate.Record
}) {
  const {uris, recentlyUnhiddenUris} = useThreadgateHiddenReplyUris()
  return useMemo(() => {
    const set = new Set([...(threadgateRecord?.hiddenReplies || []), ...uris])
    for (const uri of recentlyUnhiddenUris) {
      set.delete(uri)
    }
    return set
  }, [uris, recentlyUnhiddenUris, threadgateRecord])
}

export function useMergeThreadgateHiddenReplies() {
  const {uris, recentlyUnhiddenUris} = useThreadgateHiddenReplyUris()
  return useCallback(
    (threadgate?: AppBskyFeedThreadgate.Record) => {
      const set = new Set([...(threadgate?.hiddenReplies || []), ...uris])
      for (const uri of recentlyUnhiddenUris) {
        set.delete(uri)
      }
      return set
    },
    [uris, recentlyUnhiddenUris],
  )
}
