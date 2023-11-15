import {AppBskyFeedGetRepostedBy} from '@atproto/api'
import {useInfiniteQuery, InfiniteData, QueryKey} from '@tanstack/react-query'
import {useSession} from '../session'

const PAGE_SIZE = 30
type RQPageParam = string | undefined

export const RQKEY = (resolvedUri: string) => ['post-reposted-by', resolvedUri]

export function usePostRepostedByQuery(resolvedUri: string | undefined) {
  const {agent} = useSession()
  return useInfiniteQuery<
    AppBskyFeedGetRepostedBy.OutputSchema,
    Error,
    InfiniteData<AppBskyFeedGetRepostedBy.OutputSchema>,
    QueryKey,
    RQPageParam
  >({
    queryKey: RQKEY(resolvedUri || ''),
    async queryFn({pageParam}: {pageParam: RQPageParam}) {
      const res = await agent.getRepostedBy({
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
