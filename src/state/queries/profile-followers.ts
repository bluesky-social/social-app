import {AppBskyActorDefs, AppBskyGraphGetFollowers} from '@atproto/api'
import {
  InfiniteData,
  QueryClient,
  QueryKey,
  useInfiniteQuery,
} from '@tanstack/react-query'

import {getAgent} from '#/state/session'

const PAGE_SIZE = 30
type RQPageParam = string | undefined

export const RQKEY = (did: string) => ['profile-followers', did]

export function useProfileFollowersQuery(did: string | undefined) {
  return useInfiniteQuery<
    AppBskyGraphGetFollowers.OutputSchema,
    Error,
    InfiniteData<AppBskyGraphGetFollowers.OutputSchema>,
    QueryKey,
    RQPageParam
  >({
    queryKey: RQKEY(did || ''),
    async queryFn({pageParam}: {pageParam: RQPageParam}) {
      const res = await getAgent().app.bsky.graph.getFollowers({
        actor: did || '',
        limit: PAGE_SIZE,
        cursor: pageParam,
      })
      return res.data
    },
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.cursor,
    enabled: !!did,
  })
}

export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
): Generator<AppBskyActorDefs.ProfileView, void> {
  const queryDatas = queryClient.getQueriesData<
    InfiniteData<AppBskyGraphGetFollowers.OutputSchema>
  >({
    queryKey: ['profile-followers'],
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
