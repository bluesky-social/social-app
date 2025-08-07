import {
  type AppGndrActorDefs,
  type AppGndrGraphGetFollowers,
} from '@gander-social-atproto/api'
import {
  type InfiniteData,
  type QueryClient,
  type QueryKey,
  useInfiniteQuery,
} from '@tanstack/react-query'

import {useAgent} from '#/state/session'

const PAGE_SIZE = 30
type RQPageParam = string | undefined

const RQKEY_ROOT = 'profile-followers'
export const RQKEY = (did: string) => [RQKEY_ROOT, did]

export function useProfileFollowersQuery(did: string | undefined) {
  const agent = useAgent()
  return useInfiniteQuery<
    AppGndrGraphGetFollowers.OutputSchema,
    Error,
    InfiniteData<AppGndrGraphGetFollowers.OutputSchema>,
    QueryKey,
    RQPageParam
  >({
    queryKey: RQKEY(did || ''),
    async queryFn({pageParam}: {pageParam: RQPageParam}) {
      const res = await agent.app.gndr.graph.getFollowers({
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
): Generator<AppGndrActorDefs.ProfileView, void> {
  const queryDatas = queryClient.getQueriesData<
    InfiniteData<AppGndrGraphGetFollowers.OutputSchema>
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
