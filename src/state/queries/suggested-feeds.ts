import {useInfiniteQuery, InfiniteData, QueryKey} from '@tanstack/react-query'
import {AppBskyFeedGetSuggestedFeeds} from '@atproto/api'

import {useSession} from '#/state/session'

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
