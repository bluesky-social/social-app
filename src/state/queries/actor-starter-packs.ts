import {AppBskyGraphGetActorStarterPacks} from '@atproto/api'
import {InfiniteData, QueryKey, useInfiniteQuery} from '@tanstack/react-query'

import {STALE} from 'state/queries/index'
import {useAgent} from 'state/session'

const RQKEY_ROOT = 'actor-starter-packs'

export function useActorStarterPacksQuery({did}: {did?: string}) {
  const agent = useAgent()

  return useInfiniteQuery<
    AppBskyGraphGetActorStarterPacks.OutputSchema,
    Error,
    InfiniteData<AppBskyGraphGetActorStarterPacks.OutputSchema>,
    QueryKey,
    string | undefined
  >({
    queryKey: [RQKEY_ROOT, did],
    queryFn: async ({pageParam}: {pageParam?: string}) => {
      const res = await agent.app.bsky.graph.getActorStarterPacks({
        actor: did!,
        limit: 10,
        cursor: pageParam,
      })
      return res.data
    },
    enabled: Boolean(did),
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.cursor,
    staleTime: STALE.MINUTES.ONE,
  })
}
