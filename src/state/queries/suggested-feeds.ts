import {AppBskyFeedGetSuggestedFeeds} from '@atproto/api'
import {InfiniteData, QueryKey, useInfiniteQuery} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {getAgent} from '#/state/session'

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
