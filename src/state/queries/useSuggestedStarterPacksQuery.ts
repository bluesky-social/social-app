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

export function useSuggestedStarterPacksQuery({enabled}: {enabled?: boolean}) {
  const agent = useAgent()
  const {data: preferences} = usePreferencesQuery()
  const contentLangs = getContentLanguages().join(',')

  return useQuery({
    enabled: !!preferences && enabled !== false,
    staleTime: STALE.MINUTES.THREE,
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
