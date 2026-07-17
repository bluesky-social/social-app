import {type QueryClient, useQuery} from '@tanstack/react-query'

import {createBskyTopicsHeader} from '#/lib/api/feed/utils'
import {logger} from '#/logger'
import {getContentLanguages} from '#/state/preferences/languages'
import {STALE} from '#/state/queries'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {useAppviewClient} from '#/state/session'
import {app} from '#/lexicons'

export type QueryProps = {
  category?: string | null
  limit?: number
  enabled?: boolean
  overrideInterests: string[]
}

export const getSuggestedOnboardingUsersQueryKeyRoot =
  'unspecced-suggested-onboarding-users'
export const createGetSuggestedOnboardingUsersQueryKey = (
  props: QueryProps,
) => [
  getSuggestedOnboardingUsersQueryKeyRoot,
  props.category,
  props.limit,
  props.overrideInterests.join(','),
]

export function useGetSuggestedOnboardingUsersQuery(props: QueryProps) {
  const appviewClient = useAppviewClient()
  const {data: preferences} = usePreferencesQuery()

  return useQuery({
    enabled: !!preferences && props.enabled !== false,
    staleTime: STALE.MINUTES.THREE,
    queryKey: createGetSuggestedOnboardingUsersQueryKey(props),
    queryFn: async () => {
      const contentLangs = getContentLanguages().join(',')

      const overrideInterests = props.overrideInterests.join(',')

      const data = await appviewClient.call(
        app.bsky.unspecced.getSuggestedOnboardingUsers,
        {
          category: props.category ?? undefined,
          limit: props.limit || 10,
        },
        {
          headers: {
            ...createBskyTopicsHeader(overrideInterests),
            'Accept-Language': contentLangs,
          },
        },
      )

      if (!data.recIdStr) {
        logger.debug('getSuggestedOnboardingUsers response missing recIdStr')
      }
      return {...data, recId: data.recIdStr}
    },
  })
}

export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
): Generator<app.bsky.actor.defs.ProfileView, void> {
  const responses = queryClient.getQueriesData<{
    actors: app.bsky.actor.defs.ProfileView[]
  }>({
    queryKey: [getSuggestedOnboardingUsersQueryKeyRoot],
  })
  for (const [_key, response] of responses) {
    if (!response) {
      continue
    }

    for (const actor of response.actors) {
      if (actor.did === did) {
        yield actor
      }
    }
  }
}
