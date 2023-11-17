import {useInfiniteQuery, InfiniteData, QueryKey} from '@tanstack/react-query'
import {AppBskyFeedGetSuggestedFeeds} from '@atproto/api'

import {getAgent} from '#/state/session'
import {STALE} from '#/state/queries'

export const suggestedFeedsQueryKey = ['suggestedFeeds']

export function useSuggestedFeedsQuery() {
  return useInfiniteQuery<
    AppBskyFeedGetSuggestedFeeds.OutputSchema,
    Error,
    InfiniteData<AppBskyFeedGetSuggestedFeeds.OutputSchema>,
    QueryKey,
    string | undefined
  >({
    staleTime: STALE.HOURS.ONE,
    queryKey: suggestedFeedsQueryKey,
    queryFn: async ({pageParam}) => {
      const res = await getAgent().app.bsky.feed.getSuggestedFeeds({
        limit: 10,
        cursor: pageParam,
      })
      return res.data
    },
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.cursor,
  })
}
