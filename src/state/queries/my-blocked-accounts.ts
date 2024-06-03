import {AppBskyActorDefs, AppBskyGraphGetBlocks} from '@atproto/api'
import {
  InfiniteData,
  QueryClient,
  QueryKey,
  useInfiniteQuery,
} from '@tanstack/react-query'

import {useAgent} from '#/state/session'

const RQKEY_ROOT = 'my-blocked-accounts'
export const RQKEY = () => [RQKEY_ROOT]
type RQPageParam = string | undefined

export function useMyBlockedAccountsQuery() {
  const agent = useAgent()
  return useInfiniteQuery<
    AppBskyGraphGetBlocks.OutputSchema,
    Error,
    InfiniteData<AppBskyGraphGetBlocks.OutputSchema>,
    QueryKey,
    RQPageParam
  >({
    queryKey: RQKEY(),
    async queryFn({pageParam}: {pageParam: RQPageParam}) {
      const res = await agent.app.bsky.graph.getBlocks({
        limit: 30,
        cursor: pageParam,
      })
      return res.data
    },
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.cursor,
  })
}

export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
): Generator<AppBskyActorDefs.ProfileView, void> {
  const queryDatas = queryClient.getQueriesData<
    InfiniteData<AppBskyGraphGetBlocks.OutputSchema>
  >({
    queryKey: [RQKEY_ROOT],
  })
  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData?.pages) {
      continue
    }
    for (const page of queryData?.pages) {
      for (const block of page.blocks) {
        if (block.did === did) {
          yield block
        }
      }
    }
  }
}
