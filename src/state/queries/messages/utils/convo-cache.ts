import {
  type ChatBskyConvoDefs,
  type ChatBskyConvoListConvos,
} from '@atproto/api'
import {
  type InfiniteData,
  type QueryClient,
  type QueryKey,
} from '@tanstack/react-query'

import {RQKEY as CONVO_KEY} from '../conversation'
import {RQKEY_ROOT as CONVO_LIST_KEY} from '../list-conversations'

type ConvoUpdater = (
  prev: ChatBskyConvoDefs.ConvoView,
) => ChatBskyConvoDefs.ConvoView | undefined

export type ConvoCacheSnapshot = {
  prevConvo: ChatBskyConvoDefs.ConvoView | undefined
  prevListEntries: Array<
    [QueryKey, InfiniteData<ChatBskyConvoListConvos.OutputSchema> | undefined]
  >
}

/**
 * Writes an optimistic update to a convo across both the single-convo and
 * convo-list caches. The updater receives the current ConvoView and returns
 * the next one - return undefined to bail out (e.g. when the convo's kind
 * doesn't match what the mutation requires). Returns a snapshot that can be
 * passed to `rollbackConvoOptimistic`.
 */
export function updateConvoOptimistic(
  queryClient: QueryClient,
  convoId: string,
  updater: ConvoUpdater,
): ConvoCacheSnapshot {
  const prevConvo = queryClient.getQueryData<ChatBskyConvoDefs.ConvoView>(
    CONVO_KEY(convoId),
  )
  const prevListEntries = queryClient.getQueriesData<
    InfiniteData<ChatBskyConvoListConvos.OutputSchema>
  >({queryKey: [CONVO_LIST_KEY]})

  queryClient.setQueryData<ChatBskyConvoDefs.ConvoView>(
    CONVO_KEY(convoId),
    prev => {
      if (!prev) return
      const next = updater(prev)
      return next ?? prev
    },
  )

  queryClient.setQueriesData<
    InfiniteData<ChatBskyConvoListConvos.OutputSchema>
  >({queryKey: [CONVO_LIST_KEY]}, prev => {
    if (!prev?.pages) return
    return {
      ...prev,
      pages: prev.pages.map(page => ({
        ...page,
        convos: page.convos.map(convo => {
          if (convo.id !== convoId) return convo
          const next = updater(convo)
          return next ?? convo
        }),
      })),
    }
  })

  return {prevConvo, prevListEntries}
}

/**
 * Restores the caches to the state captured by `updateConvoOptimistic`.
 */
export function rollbackConvoOptimistic(
  queryClient: QueryClient,
  convoId: string,
  snapshot: ConvoCacheSnapshot,
) {
  if (snapshot.prevConvo) {
    queryClient.setQueryData(CONVO_KEY(convoId), snapshot.prevConvo)
  }
  for (const [key, data] of snapshot.prevListEntries) {
    queryClient.setQueryData(key, data)
  }
}
