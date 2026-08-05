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

export const createOnboardingSuggestedStarterPacksQueryKey = (
  interests?: string[],
) => ['onboarding-suggested-starter-packs', interests?.join(',')]

export function useOnboardingSuggestedStarterPacksQuery({
  enabled,
  overrideInterests,
}: {
  enabled?: boolean
  overrideInterests?: string[]
}) {
  const appviewClient = useAppviewClient()
  const {data: preferences} = usePreferencesQuery()
  const contentLangs = getContentLanguages().join(',')

  return useQuery({
    enabled: !!preferences && enabled !== false,
    staleTime: STALE.MINUTES.THREE,
    queryKey: createOnboardingSuggestedStarterPacksQueryKey(overrideInterests),
    queryFn: async () => {
      return await appviewClient.call(
        app.bsky.unspecced.getOnboardingSuggestedStarterPacks,
        {limit: 6},
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
