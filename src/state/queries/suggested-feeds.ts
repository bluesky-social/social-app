import {useInfiniteQuery, InfiniteData, QueryKey} from '@tanstack/react-query'
import {AppBskyFeedGetSuggestedFeeds} from '@atproto/api'

import {useSession} from '#/state/session'
import {STALE} from '#/state/queries'

export const suggestedFeedsQueryKey = ['suggestedFeeds']

export function useSuggestedFeedsQuery() {
  const {agent} = useSession()

  return useInfiniteQuery<
    AppBskyFeedGetSuggestedFeeds.OutputSchema,
    Error,
    InfiniteData<AppBskyFeedGetSuggestedFeeds.OutputSchema>,
    QueryKey,
    string | undefined
  >({
    staleTime: STALE.INFINITY,
    queryKey: suggestedFeedsQueryKey,
    queryFn: async ({pageParam}) => {
      const res = await agent.app.bsky.feed.getSuggestedFeeds({
        limit: 10,
        cursor: pageParam,
      })
      return res.data
    },
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.cursor,
  })
}
