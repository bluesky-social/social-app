import {
  type InfiniteData,
  type QueryClient,
  type QueryKey,
  useInfiniteQuery,
} from '@tanstack/react-query'

import {useAppviewClient} from '#/state/session'
import {app} from '#/lexicons'
import {useAutoPagination} from './util'

const RQKEY_ROOT = 'my-muted-accounts'
const PAGE_SIZE = 30
export const RQKEY = () => [RQKEY_ROOT]
type RQPageParam = string | undefined

export function useMyMutedAccountsQuery() {
  const client = useAppviewClient()
  const query = useInfiniteQuery<
    app.bsky.graph.getMutes.$OutputBody,
    Error,
    InfiniteData<app.bsky.graph.getMutes.$OutputBody>,
    QueryKey,
    RQPageParam
  >({
    queryKey: RQKEY(),
    async queryFn({pageParam}: {pageParam: RQPageParam}) {
      return await client.call(app.bsky.graph.getMutes, {
        limit: PAGE_SIZE,
        cursor: pageParam,
      })
    },
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.cursor,
  })
  const itemCount =
    query.data?.pages.reduce((count, page) => count + page.mutes.length, 0) ?? 0
  useAutoPagination(query, itemCount, PAGE_SIZE)
  return query
}

export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
): Generator<app.bsky.actor.defs.ProfileView, void> {
  const queryDatas = queryClient.getQueriesData<
    InfiniteData<app.bsky.graph.getMutes.$OutputBody>
  >({
    queryKey: [RQKEY_ROOT],
  })
  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData?.pages) {
      continue
    }
    for (const page of queryData?.pages) {
      for (const mute of page.mutes) {
        if (mute.did === did) {
          yield mute
        }
      }
    }
  }
}
