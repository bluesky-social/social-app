import {
  type AppBskyActorDefs,
  type AppBskyGraphGetFollowers,
} from '@atproto/api'
import {
  type InfiniteData,
  type QueryClient,
  type QueryKey,
  useInfiniteQuery,
} from '@tanstack/react-query'
import shuffle from 'lodash.shuffle'

import {useAgent} from '#/state/session'
import {useAnalytics} from '#/analytics'

const DEFAULT_SORT = 'latest'
const PAGE_SIZE = 30
type RQPageParam = string | undefined

const RQKEY_ROOT = 'profile-followers'
export const RQKEY = (did: string, sort: 'latest' | 'top' = DEFAULT_SORT) => [
  RQKEY_ROOT,
  did,
  sort,
]

export function useProfileFollowersQuery(
  did?: string,
  {
    sort,
  }: {
    sort?: 'latest' | 'top'
  } = {},
) {
  const ax = useAnalytics()
  const isSortEnabled = ax.features.enabled(ax.features.FollowSortEnable)
  const agent = useAgent()

  const sortParam = isSortEnabled ? sort || DEFAULT_SORT : undefined

  return useInfiniteQuery<
    AppBskyGraphGetFollowers.OutputSchema,
    Error,
    InfiniteData<AppBskyGraphGetFollowers.OutputSchema>,
    QueryKey,
    RQPageParam
  >({
    queryKey: RQKEY(did || '', sortParam),
    async queryFn({pageParam}: {pageParam: RQPageParam}) {
      const res = await agent.app.bsky.graph.getFollowers({
        actor: did || '',
        limit: PAGE_SIZE,
        cursor: pageParam,
        sort: sortParam,
      })
      if (sortParam === 'top' && pageParam === undefined) {
        return {
          ...res.data,
          followers: shuffle(res.data.followers),
        }
      }
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
