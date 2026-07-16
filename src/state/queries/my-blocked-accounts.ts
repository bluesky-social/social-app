import {
  type InfiniteData,
  type QueryClient,
  type QueryKey,
  useInfiniteQuery,
} from '@tanstack/react-query'

import {useAppviewClient} from '#/state/session'
import {app} from '#/lexicons'

const RQKEY_ROOT = 'my-blocked-accounts'
export const RQKEY = () => [RQKEY_ROOT]
type RQPageParam = string | undefined

export function useMyBlockedAccountsQuery() {
  const client = useAppviewClient()
  return useInfiniteQuery<
    app.bsky.graph.getBlocks.$OutputBody,
    Error,
    InfiniteData<app.bsky.graph.getBlocks.$OutputBody>,
    QueryKey,
    RQPageParam
  >({
    queryKey: RQKEY(),
    async queryFn({pageParam}: {pageParam: RQPageParam}) {
      return await client.call(app.bsky.graph.getBlocks, {
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
): Generator<app.bsky.actor.defs.ProfileView, void> {
  const queryDatas = queryClient.getQueriesData<
    InfiniteData<app.bsky.graph.getBlocks.$OutputBody>
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
