import {type AtIdentifierString} from '@atproto/syntax'
import {
  type InfiniteData,
  type QueryClient,
  type QueryKey,
  useInfiniteQuery,
} from '@tanstack/react-query'

import {useAppviewClient} from '#/state/session'
import {app} from '#/lexicons'

const PAGE_SIZE = 30
type RQPageParam = string | undefined

const RQKEY_ROOT = 'profile-followers'
export const RQKEY = (did: string) => [RQKEY_ROOT, did]

export function useProfileFollowersQuery(did: string | undefined) {
  const client = useAppviewClient()
  return useInfiniteQuery<
    app.bsky.graph.getFollowers.$OutputBody,
    Error,
    InfiniteData<app.bsky.graph.getFollowers.$OutputBody>,
    QueryKey,
    RQPageParam
  >({
    queryKey: RQKEY(did || ''),
    async queryFn({pageParam}: {pageParam: RQPageParam}) {
      return await client.call(app.bsky.graph.getFollowers, {
        actor: (did || '') as AtIdentifierString,
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
    InfiniteData<app.bsky.graph.getFollowers.$OutputBody>
  >({
    queryKey: [RQKEY_ROOT],
  })
  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData?.pages) {
      continue
    }
    for (const page of queryData?.pages) {
      for (const follower of page.followers) {
        if (follower.did === did) {
          yield follower
        }
      }
    }
  }
}
