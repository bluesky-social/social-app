import {AppBskyActorDefs, AppBskyFeedGetRepostedBy} from '@atproto/api'
import {
  useInfiniteQuery,
  InfiniteData,
  QueryClient,
  QueryKey,
} from '@tanstack/react-query'

import {getAgent} from '#/state/session'

const PAGE_SIZE = 30
type RQPageParam = string | undefined

// TODO refactor invalidate on mutate?
export const RQKEY = (resolvedUri: string) => ['post-reposted-by', resolvedUri]

export function usePostRepostedByQuery(resolvedUri: string | undefined) {
  return useInfiniteQuery<
    AppBskyFeedGetRepostedBy.OutputSchema,
    Error,
    InfiniteData<AppBskyFeedGetRepostedBy.OutputSchema>,
    QueryKey,
    RQPageParam
  >({
    queryKey: RQKEY(resolvedUri || ''),
    async queryFn({pageParam}: {pageParam: RQPageParam}) {
      const res = await getAgent().getRepostedBy({
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
    InfiniteData<AppBskyFeedGetRepostedBy.OutputSchema>
  >({
    queryKey: ['post-reposted-by'],
  })
  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData?.pages) {
      continue
    }
    for (const page of queryData?.pages) {
      for (const repostedBy of page.repostedBy) {
        if (repostedBy.did === did) {
          yield repostedBy
        }
      }
    }
  }
}
