import {useQuery} from '@tanstack/react-query'

import {
  aggregateUserInterests,
  createBskyTopicsHeader,
} from '#/lib/api/feed/utils'
import {getContentLanguages} from '#/state/preferences/languages'
import {STALE} from '#/state/queries'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {useAppviewClient} from '#/state/session'
import * as AppBskyUnspeccedGetSuggestedStarterPacks from '#/lexicons/app/bsky/unspecced/getSuggestedStarterPacks'

export const createSuggestedStarterPacksQueryKey = (interests?: string[]) => [
  'suggested-starter-packs',
  interests?.join(','),
]

export function useSuggestedStarterPacksQuery({
  enabled,
  overrideInterests,
}: {
  enabled?: boolean
  overrideInterests?: string[]
}) {
  const client = useAppviewClient()
  const {data: preferences} = usePreferencesQuery()
  const contentLangs = getContentLanguages().join(',')

  return useQuery({
    enabled: !!preferences && enabled !== false,
    staleTime: STALE.MINUTES.THREE,
    queryKey: createSuggestedStarterPacksQueryKey(overrideInterests),
    queryFn: async () => {
      return await client.call(
        AppBskyUnspeccedGetSuggestedStarterPacks,
        {},
        {
          headers: {
            ...createBskyTopicsHeader(
              overrideInterests
                ? overrideInterests.join(',')
                : aggregateUserInterests(preferences),
            ),
            'Accept-Language': contentLangs,
          },
        },
      )
    },
  })
}
