import {type QueryClient, useQuery} from '@tanstack/react-query'

import {createBskyTopicsHeader} from '#/lib/api/feed/utils'
import {logger} from '#/logger'
import {getContentLanguages} from '#/state/preferences/languages'
import {STALE} from '#/state/queries'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {useAgent} from '#/state/session'
import {type app} from '#/lexicons'
import {toLex} from '#/types/bsky'

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

      const overrideInterests = props.overrideInterests.join(',')

      const {data} = await agent.app.bsky.unspecced.getSuggestedOnboardingUsers(
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
      /*
       * TODO(phase4): drop toLex once getSuggestedOnboardingUsers migrates off
       * the bridge agent (this unspecced endpoint is intentionally left on the
       * bridge in Phase 3, so it returns old `@atproto/api` view types).
       */
      return toLex<{
        actors: app.bsky.actor.defs.ProfileView[]
        recId: string | undefined
      }>({...data, recId: data.recIdStr})
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
