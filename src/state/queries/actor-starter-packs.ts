import {AppBskyGraphGetActorStarterPacks} from '@atproto/api'
import {
  InfiniteData,
  QueryClient,
  QueryKey,
  useInfiniteQuery,
} from '@tanstack/react-query'

import {useAgent} from '#/state/session'

export const RQKEY_ROOT = 'actor-starter-packs'
export const RQKEY = (did?: string) => [RQKEY_ROOT, did]

export function useActorStarterPacksQuery({
  did,
  enabled = true,
}: {
  did?: string
  enabled?: boolean
}) {
  const agent = useAgent()

  return useInfiniteQuery<
    AppBskyGraphGetActorStarterPacks.OutputSchema,
    Error,
    InfiniteData<AppBskyGraphGetActorStarterPacks.OutputSchema>,
    QueryKey,
    string | undefined
  >({
    queryKey: RQKEY(did),
    queryFn: async ({pageParam}: {pageParam?: string}) => {
      const res = await agent.app.bsky.graph.getActorStarterPacks({
        actor: did!,
        limit: 10,
        cursor: pageParam,
      })
      return res.data
    },
    enabled: Boolean(did) && enabled,
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.cursor,
  })
}

export async function invalidateActorStarterPacksQuery({
  queryClient,
  did,
}: {
  queryClient: QueryClient
  did: string
}) {
  await queryClient.invalidateQueries({queryKey: RQKEY(did)})
}
