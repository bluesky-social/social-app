import {type AtUriString} from '@atproto/syntax'
import {
  type InfiniteData,
  type QueryClient,
  type QueryKey,
  useInfiniteQuery,
  useQuery,
} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {createQueryKey} from '#/state/queries/util'
import {useAppviewClient} from '#/state/session'
import {app} from '#/lexicons'

const PAGE_SIZE = 30
type RQPageParam = string | undefined

// TODO refactor invalidate on mutate?
const RQKEY_ROOT = 'liked-by'
export const RQKEY = (resolvedUri: string) => [RQKEY_ROOT, resolvedUri]

export function useLikedByQuery(resolvedUri: string | undefined) {
  const client = useAppviewClient()
  return useInfiniteQuery<
    app.bsky.feed.getLikes.$OutputBody,
    Error,
    InfiniteData<app.bsky.feed.getLikes.$OutputBody>,
    QueryKey,
    RQPageParam
  >({
    queryKey: RQKEY(resolvedUri || ''),
    async queryFn({pageParam}: {pageParam: RQPageParam}) {
      return await client.call(app.bsky.feed.getLikes, {
        uri: (resolvedUri || '') as AtUriString,
        limit: PAGE_SIZE,
        cursor: pageParam,
      })
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
  const client = useAppviewClient()
  return useQuery({
    queryKey: createLikedBySampleQueryKey({uri: uri ?? ''}),
    queryFn: async () => {
      return await client.call(app.bsky.feed.getLikes, {
        uri: (uri ?? '') as AtUriString,
        limit: SAMPLE_SIZE,
      })
    },
    staleTime: STALE.MINUTES.FIVE,
    enabled: !!uri,
    /*
     * Consumers fall back to a plain like count when this query fails, so
     * failing fast is preferable to amplifying getLikes load with retries.
     */
    retry: 1,
  })
}

export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
): Generator<app.bsky.actor.defs.ProfileView, void> {
  const queryDatas = queryClient.getQueriesData<
    InfiniteData<app.bsky.feed.getLikes.$OutputBody>
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
    queryClient.getQueriesData<app.bsky.feed.getLikes.$OutputBody>({
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
