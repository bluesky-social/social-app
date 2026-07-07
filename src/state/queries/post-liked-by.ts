import {type AppBskyActorDefs, type AppBskyFeedGetLikes} from '@atproto/api'
import {
  type InfiniteData,
  type QueryClient,
  type QueryKey,
  useInfiniteQuery,
  useQuery,
} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {createQueryKey} from '#/state/queries/util'
import {useAgent} from '#/state/session'

const PAGE_SIZE = 30
type RQPageParam = string | undefined

// TODO refactor invalidate on mutate?
const RQKEY_ROOT = 'liked-by'
export const RQKEY = (resolvedUri: string) => [RQKEY_ROOT, resolvedUri]

export function useLikedByQuery(resolvedUri: string | undefined) {
  const agent = useAgent()
  return useInfiniteQuery<
    AppBskyFeedGetLikes.OutputSchema,
    Error,
    InfiniteData<AppBskyFeedGetLikes.OutputSchema>,
    QueryKey,
    RQPageParam
  >({
    queryKey: RQKEY(resolvedUri || ''),
    async queryFn({pageParam}: {pageParam: RQPageParam}) {
      const res = await agent.getLikes({
        uri: resolvedUri || '',
        limit: PAGE_SIZE,
        cursor: pageParam,
      })
      return res.data
    },
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.cursor,
    enabled: !!resolvedUri,
  })
}

/**
 * The maximum `limit` accepted by `app.bsky.feed.getLikes` in a single
 * request.
 */
const SAMPLE_SIZE = 100

const likedBySampleQueryKeyRoot = 'liked-by-sample'
export const createLikedBySampleQueryKey = (args: {uri: string}) =>
  createQueryKey(likedBySampleQueryKeyRoot, args)

/**
 * A single-request sample of a post's most recent likers, as many as the API
 * allows in one page (100). Used for the known-likers social proof on the
 * post thread page. Kept separate from `useLikedByQuery` so it does not
 * perturb the liked-by screen's pagination.
 */
export function useLikedBySampleQuery({uri}: {uri: string | undefined}) {
  const agent = useAgent()
  return useQuery({
    queryKey: createLikedBySampleQueryKey({uri: uri ?? ''}),
    queryFn: async () => {
      const res = await agent.getLikes({uri: uri ?? '', limit: SAMPLE_SIZE})
      return res.data
    },
    staleTime: STALE.MINUTES.FIVE,
    enabled: !!uri,
  })
}

export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
): Generator<AppBskyActorDefs.ProfileView, void> {
  const queryDatas = queryClient.getQueriesData<
    InfiniteData<AppBskyFeedGetLikes.OutputSchema>
  >({
    queryKey: [RQKEY_ROOT],
  })
  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData?.pages) {
      continue
    }
    for (const page of queryData?.pages) {
      for (const like of page.likes) {
        if (like.actor.did === did) {
          yield like.actor
        }
      }
    }
  }
  const sampleQueryDatas =
    queryClient.getQueriesData<AppBskyFeedGetLikes.OutputSchema>({
      queryKey: [likedBySampleQueryKeyRoot],
    })
  for (const [_queryKey, queryData] of sampleQueryDatas) {
    if (!queryData?.likes) {
      continue
    }
    for (const like of queryData.likes) {
      if (like.actor.did === did) {
        yield like.actor
      }
    }
  }
}
