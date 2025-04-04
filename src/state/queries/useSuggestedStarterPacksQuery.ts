import {useQuery} from '@tanstack/react-query'

import {
  aggregateUserInterests,
  createBskyTopicsHeader,
} from '#/lib/api/feed/utils'
import {getContentLanguages} from '#/state/preferences/languages'
import {STALE} from '#/state/queries'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {useAgent} from '#/state/session'

export const createSuggestedStarterPacksQueryKey = () => [
  'suggested-starter-packs',
]

export function useSuggestedStarterPacksQuery() {
  const agent = useAgent()
  const {data: preferences} = usePreferencesQuery()
  const contentLangs = getContentLanguages().join(',')

  return useQuery({
    enabled: !!preferences,
    refetchOnWindowFocus: true,
    staleTime: STALE.MINUTES.ONE,
    queryKey: createSuggestedStarterPacksQueryKey(),
    async queryFn() {
      const {data} = await agent.app.bsky.unspecced.getSuggestedStarterPacks(
        undefined,
        {
          headers: {
            ...createBskyTopicsHeader(aggregateUserInterests(preferences)),
            'Accept-Language': contentLangs,
          },
        },
      )
      return data
    },
  })
}
