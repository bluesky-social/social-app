import {AppBskyActorDefs, AppBskyGraphGetKnownFollowers} from '@atproto/api'
import {
  InfiniteData,
  QueryClient,
  QueryKey,
  useInfiniteQuery,
} from '@tanstack/react-query'

import {useAgent} from '#/state/session'

const PAGE_SIZE = 50
type RQPageParam = string | undefined

const RQKEY_ROOT = 'profile-known-followers'
export const RQKEY = (did: string) => [RQKEY_ROOT, did]

export function useProfileKnownFollowersQuery(did: string | undefined) {
  const agent = useAgent()
  return useInfiniteQuery<
    AppBskyGraphGetKnownFollowers.OutputSchema,
    Error,
    InfiniteData<AppBskyGraphGetKnownFollowers.OutputSchema>,
    QueryKey,
    RQPageParam
  >({
    queryKey: RQKEY(did || ''),
    async queryFn({pageParam}: {pageParam: RQPageParam}) {
      const res = await agent.app.bsky.graph.getKnownFollowers({
        actor: did!,
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
    InfiniteData<AppBskyGraphGetKnownFollowers.OutputSchema>
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
