import {type AppBskyActorDefs, type AppBskyGraphGetBlocks} from '@atproto/api'
import {
  type InfiniteData,
  type QueryClient,
  type QueryKey,
  useInfiniteQuery,
} from '@tanstack/react-query'

import {useAgent} from '#/state/session'
import {useAutoPagination} from './util'

const RQKEY_ROOT = 'my-blocked-accounts'
const PAGE_SIZE = 30
export const RQKEY = () => [RQKEY_ROOT]
type RQPageParam = string | undefined

export function useMyBlockedAccountsQuery() {
  const agent = useAgent()
  const query = useInfiniteQuery<
    AppBskyGraphGetBlocks.OutputSchema,
    Error,
    InfiniteData<AppBskyGraphGetBlocks.OutputSchema>,
    QueryKey,
    RQPageParam
  >({
    queryKey: RQKEY(),
    async queryFn({pageParam}: {pageParam: RQPageParam}) {
      const res = await agent.app.bsky.graph.getBlocks({
        limit: PAGE_SIZE,
        cursor: pageParam,
      })
      return res.data
    },
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.cursor,
  })
  const itemCount =
    query.data?.pages.reduce((count, page) => count + page.blocks.length, 0) ??
    0
  useAutoPagination(query, itemCount, PAGE_SIZE)
  return query
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
