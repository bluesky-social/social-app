import {AppBskyActorDefs, AppBskyFeedGetLikes} from '@atproto/api'
import {
  InfiniteData,
  QueryClient,
  QueryKey,
  useInfiniteQuery,
} from '@tanstack/react-query'

import {getAgent} from '#/state/session'

const PAGE_SIZE = 30
type RQPageParam = string | undefined

// TODO refactor invalidate on mutate?
export const RQKEY = (resolvedUri: string) => ['liked-by', resolvedUri]

export function useLikedByQuery(resolvedUri: string | undefined) {
  return useInfiniteQuery<
    AppBskyFeedGetLikes.OutputSchema,
    Error,
    InfiniteData<AppBskyFeedGetLikes.OutputSchema>,
    QueryKey,
    RQPageParam
  >({
    queryKey: RQKEY(resolvedUri || ''),
    async queryFn({pageParam}: {pageParam: RQPageParam}) {
      const res = await getAgent().getLikes({
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

export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
): Generator<AppBskyActorDefs.ProfileView, void> {
  const queryDatas = queryClient.getQueriesData<
    InfiniteData<AppBskyFeedGetLikes.OutputSchema>
  >({
    queryKey: ['post-liked-by'],
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
}
