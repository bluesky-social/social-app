import {useQuery} from '@tanstack/react-query'

import {
  aggregateUserInterests,
  createBskyTopicsHeader,
} from '#/lib/api/feed/utils'
import {getContentLanguages} from '#/state/preferences/languages'
import {STALE} from '#/state/queries'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {useAppviewClient} from '#/state/session'
import {app} from '#/lexicons'

export const DEFAULT_LIMIT = 15

export const createGetSuggestedFeedsQueryKey = () => ['suggested-feeds']

export function useGetSuggestedFeedsQuery({enabled}: {enabled?: boolean}) {
  const appviewClient = useAppviewClient()
  const {data: preferences} = usePreferencesQuery()
  const savedFeeds = preferences?.savedFeeds

  return useQuery({
    enabled: !!preferences && enabled !== false,
    staleTime: STALE.MINUTES.THREE,
    queryKey: createGetSuggestedFeedsQueryKey(),
    queryFn: async () => {
      const contentLangs = getContentLanguages().join(',')
      const data = await appviewClient.call(
        app.bsky.unspecced.getSuggestedFeeds,
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
