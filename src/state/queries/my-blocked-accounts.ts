import {AppBskyActorDefs, AppBskyGraphGetBlocks} from '@atproto/api'
import {
  useInfiniteQuery,
  InfiniteData,
  QueryClient,
  QueryKey,
} from '@tanstack/react-query'

import {getAgent} from '#/state/session'

export const RQKEY = () => ['my-blocked-accounts']
type RQPageParam = string | undefined

export function useMyBlockedAccountsQuery() {
  return useInfiniteQuery<
    AppBskyGraphGetBlocks.OutputSchema,
    Error,
    InfiniteData<AppBskyGraphGetBlocks.OutputSchema>,
    QueryKey,
    RQPageParam
  >({
    queryKey: RQKEY(),
    async queryFn({pageParam}: {pageParam: RQPageParam}) {
      const res = await getAgent().app.bsky.graph.getBlocks({
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
    queryKey: ['my-blocked-accounts'],
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
