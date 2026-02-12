import {
  type AppBskyActorDefs,
  type AppBskyUnspeccedGetSuggestedOnboardingUsers,
} from '@atproto/api'
import {type QueryClient, useQuery} from '@tanstack/react-query'

import {createBskyTopicsHeader} from '#/lib/api/feed/utils'
import {logger} from '#/logger'
import {getContentLanguages} from '#/state/preferences/languages'
import {STALE} from '#/state/queries'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {useAgent} from '#/state/session'

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
  const agent = useAgent()
  const {data: preferences} = usePreferencesQuery()

  return useQuery({
    enabled: !!preferences && props.enabled !== false,
    staleTime: STALE.MINUTES.THREE,
    queryKey: createGetSuggestedOnboardingUsersQueryKey(props),
    queryFn: async () => {
      const contentLangs = getContentLanguages().join(',')

      const interests = props.overrideInterests.join(',')

      const {data} = await agent.app.bsky.unspecced.getSuggestedOnboardingUsers(
        {
          category: props.category ?? undefined,
          limit: props.limit || 10,
        },
        {
          headers: {
            ...createBskyTopicsHeader(interests),
            'Accept-Language': contentLangs,
          },
        },
      )
      // FALLBACK: if no results for 'all', try again with no interests specified
      if (!props.category && data.actors.length === 0) {
        logger.error(
          `Did not get any suggested onboarding users, falling back - interests: ${interests}`,
        )
        const {data: fallbackData} =
          await agent.app.bsky.unspecced.getSuggestedOnboardingUsers(
            {
              category: props.category ?? undefined,
              limit: props.limit || 10,
            },
            {
              headers: {
                'Accept-Language': contentLangs,
              },
            },
          )
        return fallbackData
      }

      return data
    },
  })
}

export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
): Generator<AppBskyActorDefs.ProfileView, void> {
  const responses =
    queryClient.getQueriesData<AppBskyUnspeccedGetSuggestedOnboardingUsers.OutputSchema>(
      {
        queryKey: [getSuggestedOnboardingUsersQueryKeyRoot],
      },
    )
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
