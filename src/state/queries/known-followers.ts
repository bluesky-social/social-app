import {type AtIdentifierString} from '@atproto/syntax'
import {
  type InfiniteData,
  type QueryClient,
  type QueryKey,
  useInfiniteQuery,
} from '@tanstack/react-query'

import {useAppviewClient} from '#/state/session'
import {app} from '#/lexicons'

const PAGE_SIZE = 50
type RQPageParam = string | undefined

const RQKEY_ROOT = 'profile-known-followers'
export const RQKEY = (did: string) => [RQKEY_ROOT, did]

export function useProfileKnownFollowersQuery(did: string | undefined) {
  const client = useAppviewClient()
  return useInfiniteQuery<
    app.bsky.graph.getKnownFollowers.$OutputBody,
    Error,
    InfiniteData<app.bsky.graph.getKnownFollowers.$OutputBody>,
    QueryKey,
    RQPageParam
  >({
    queryKey: RQKEY(did || ''),
    async queryFn({pageParam}: {pageParam: RQPageParam}) {
      return await client.call(app.bsky.graph.getKnownFollowers, {
        actor: did! as AtIdentifierString,
        limit: PAGE_SIZE,
        cursor: pageParam,
      })
    },
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.cursor,
    enabled: !!did,
  })
}

export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
): Generator<app.bsky.actor.defs.ProfileView, void> {
  const queryDatas = queryClient.getQueriesData<
    InfiniteData<app.bsky.graph.getKnownFollowers.$OutputBody>
  >({
    queryKey: [RQKEY_ROOT],
  })
  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData?.pages) {
      continue
    }
    for (const page of queryData?.pages) {
      for (const follow of page.followers) {
        if (follow.did === did) {
          yield follow
        }
      }
    }
  }
}
