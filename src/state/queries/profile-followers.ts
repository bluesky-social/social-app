import {
  type InfiniteData,
  type QueryClient,
  type QueryKey,
  useInfiniteQuery,
} from '@tanstack/react-query'

import {useAppviewClient} from '#/state/session'
import {useAnalytics} from '#/analytics'
import type * as AppBskyActorDefs from '#/lexicons/app/bsky/actor/defs'
import * as AppBskyGraphGetFollowers from '#/lexicons/app/bsky/graph/getFollowers'

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
  const client = useAppviewClient()

  const sortParam = isSortEnabled ? sort || DEFAULT_SORT : undefined

  return useInfiniteQuery<
    AppBskyGraphGetFollowers.$OutputBody,
    Error,
    InfiniteData<AppBskyGraphGetFollowers.$OutputBody>,
    QueryKey,
    RQPageParam
  >({
    queryKey: RQKEY(did || '', sortParam),
    async queryFn({pageParam}: {pageParam: RQPageParam}) {
      /*
       * The vendored lexicon does not declare `sort`, so it is spread in only
       * when set and the whole params object is asserted. lex forwards
       * undeclared params verbatim but rejects an undeclared key whose value
       * is `undefined`, hence the conditional spread.
       */
      return await client.call(AppBskyGraphGetFollowers, {
        actor: did || '',
        limit: PAGE_SIZE,
        cursor: pageParam,
        ...(sortParam ? {sort: sortParam} : {}),
      } as AppBskyGraphGetFollowers.$Params)
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
    InfiniteData<AppBskyGraphGetFollowers.$OutputBody>
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
