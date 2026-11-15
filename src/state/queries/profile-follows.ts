import {
  type InfiniteData,
  type QueryClient,
  type QueryKey,
  useInfiniteQuery,
} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {useAppviewClient} from '#/state/session'
import {useAnalytics} from '#/analytics'
import {app} from '#/lexicons'

const DEFAULT_SORT = 'latest'
const PAGE_SIZE = 30
type RQPageParam = string | undefined

// TODO refactor invalidate on mutate?
const RQKEY_ROOT = 'profile-follows'
export const RQKEY = (did: string, sort: 'latest' | 'top' = DEFAULT_SORT) => [
  RQKEY_ROOT,
  did,
  sort,
]

export function useProfileFollowsQuery(
  did: string | undefined,
  {
    limit,
    sort,
  }: {
    limit?: number
    sort?: 'latest' | 'top'
  } = {},
) {
  const ax = useAnalytics()
  const isSortEnabled = ax.features.enabled(ax.features.FollowSortEnable)
  const client = useAppviewClient()

  const sortParam = isSortEnabled ? sort || DEFAULT_SORT : undefined

  return useInfiniteQuery<
    app.bsky.graph.getFollows.$OutputBody,
    Error,
    InfiniteData<app.bsky.graph.getFollows.$OutputBody>,
    QueryKey,
    RQPageParam
  >({
    staleTime: STALE.MINUTES.ONE,
    queryKey: RQKEY(did || '', sortParam),
    async queryFn({pageParam}: {pageParam: RQPageParam}) {
      /*
       * The vendored lexicon does not declare `sort`, so it is spread in only
       * when set and the whole params object is asserted. lex forwards
       * undeclared params verbatim but rejects an undeclared key whose value
       * is `undefined`, hence the conditional spread.
       */
      return await client.call(app.bsky.graph.getFollows, {
        actor: did || '',
        limit: limit || PAGE_SIZE,
        cursor: pageParam,
        ...(sortParam ? {sort: sortParam} : {}),
      } as app.bsky.graph.getFollows.$Params)
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
    InfiniteData<app.bsky.graph.getFollows.$OutputBody>
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
