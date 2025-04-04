import {useQuery} from '@tanstack/react-query'

import {
  aggregateUserInterests,
  createBskyTopicsHeader,
} from '#/lib/api/feed/utils'
import {getContentLanguages} from '#/state/preferences/languages'
import {STALE} from '#/state/queries'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {useAgent} from '#/state/session'

export const DEFAULT_LIMIT = 5

export const createGetTrendsQueryKey = () => ['suggested-feeds']

export function useGetSuggestedFeedsQuery() {
  const agent = useAgent()
  const {data: preferences} = usePreferencesQuery()
  const savedFeeds = preferences?.savedFeeds

  return useQuery({
    enabled: !!preferences,
    refetchOnWindowFocus: true,
    staleTime: STALE.MINUTES.ONE,
    queryKey: createGetTrendsQueryKey(),
    queryFn: async () => {
      const contentLangs = getContentLanguages().join(',')
      const {data} = await agent.app.bsky.unspecced.getSuggestedFeeds(
        {
          limit: DEFAULT_LIMIT,
        },
        {
          headers: {
            ...createBskyTopicsHeader(aggregateUserInterests(preferences)),
            'Accept-Language': contentLangs,
          },
        },
      )

      return {
        feeds: data.feeds.filter(feed => {
          const isSaved = !!savedFeeds?.find(s => s.value === feed.uri)
          return !isSaved
        }),
      }
    },
  })
}
