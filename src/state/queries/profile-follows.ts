import {
  type AppGndrActorDefs,
  type AppGndrGraphGetFollows,
} from '@gander-social-atproto/api'
import {
  type InfiniteData,
  type QueryClient,
  type QueryKey,
  useInfiniteQuery,
} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {useAgent} from '#/state/session'

const PAGE_SIZE = 30
type RQPageParam = string | undefined

// TODO refactor invalidate on mutate?
const RQKEY_ROOT = 'profile-follows'
export const RQKEY = (did: string) => [RQKEY_ROOT, did]

export function useProfileFollowsQuery(
  did: string | undefined,
  {
    limit,
  }: {
    limit?: number
  } = {
    limit: PAGE_SIZE,
  },
) {
  const agent = useAgent()
  return useInfiniteQuery<
    AppGndrGraphGetFollows.OutputSchema,
    Error,
    InfiniteData<AppGndrGraphGetFollows.OutputSchema>,
    QueryKey,
    RQPageParam
  >({
    staleTime: STALE.MINUTES.ONE,
    queryKey: RQKEY(did || ''),
    async queryFn({pageParam}: {pageParam: RQPageParam}) {
      const res = await agent.app.gndr.graph.getFollows({
        actor: did || '',
        limit: limit || PAGE_SIZE,
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
    InfiniteData<AppGndrGraphGetFollows.OutputSchema>
  >({
    queryKey: [RQKEY_ROOT],
  })
  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData?.pages) {
      continue
    }
    for (const page of queryData?.pages) {
      for (const follow of page.follows) {
        if (follow.did === did) {
          yield follow
        }
      }
    }
  }
}
