import {
  type InfiniteData,
  type QueryClient,
  type QueryKey,
  useInfiniteQuery,
} from '@tanstack/react-query'

import {useAppviewClient} from '#/state/session'
import type * as AppBskyActorDefs from '#/lexicons/app/bsky/actor/defs'
import * as AppBskyGraphGetBlocks from '#/lexicons/app/bsky/graph/getBlocks'

const RQKEY_ROOT = 'my-blocked-accounts'
export const RQKEY = () => [RQKEY_ROOT]
type RQPageParam = string | undefined

export function useMyBlockedAccountsQuery() {
  const client = useAppviewClient()
  return useInfiniteQuery<
    AppBskyGraphGetBlocks.$OutputBody,
    Error,
    InfiniteData<AppBskyGraphGetBlocks.$OutputBody>,
    QueryKey,
    RQPageParam
  >({
    queryKey: RQKEY(),
    async queryFn({pageParam}: {pageParam: RQPageParam}) {
      return await client.call(AppBskyGraphGetBlocks, {
        limit: 30,
        cursor: pageParam,
      })
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
    InfiniteData<AppBskyGraphGetBlocks.$OutputBody>
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
