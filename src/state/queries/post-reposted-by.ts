import {AppBskyFeedGetRepostedBy} from '@atproto/api'
import {useInfiniteQuery, InfiniteData, QueryKey} from '@tanstack/react-query'

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
