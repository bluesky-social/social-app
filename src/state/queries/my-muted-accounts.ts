import {
  type AppGndrActorDefs,
  type AppGndrGraphGetMutes,
} from '@gander-social-atproto/api'
import {
  type InfiniteData,
  type QueryClient,
  type QueryKey,
  useInfiniteQuery,
} from '@tanstack/react-query'

import {useAgent} from '#/state/session'

const RQKEY_ROOT = 'my-muted-accounts'
export const RQKEY = () => [RQKEY_ROOT]
type RQPageParam = string | undefined

export function useMyMutedAccountsQuery() {
  const agent = useAgent()
  return useInfiniteQuery<
    AppGndrGraphGetMutes.OutputSchema,
    Error,
    InfiniteData<AppGndrGraphGetMutes.OutputSchema>,
    QueryKey,
    RQPageParam
  >({
    queryKey: RQKEY(),
    async queryFn({pageParam}: {pageParam: RQPageParam}) {
      const res = await agent.app.gndr.graph.getMutes({
        limit: 30,
        cursor: pageParam,
      })
      return res.data
    },
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.cursor,
  })
}

export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
): Generator<AppGndrActorDefs.ProfileView, void> {
  const queryDatas = queryClient.getQueriesData<
    InfiniteData<AppGndrGraphGetMutes.OutputSchema>
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
