import {type QueryClient, useQuery} from '@tanstack/react-query'

import {
  aggregateUserInterests,
  createBskyTopicsHeader,
} from '#/lib/api/feed/utils'
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
}

export const getSuggestedUsersForSeeMoreQueryKeyRoot =
  'unspecced-suggested-users-for-explore'
export const createGetSuggestedUsersForSeeMoreQueryKey = (props: {
  category?: string | null
  limit?: number
}) => [getSuggestedUsersForSeeMoreQueryKeyRoot, props.category, props.limit]

export function useGetSuggestedUsersForSeeMoreQuery(props: QueryProps = {}) {
  const agent = useAgent()
  const {data: preferences} = usePreferencesQuery()

  return useQuery({
    enabled: props.enabled ?? true,
    staleTime: STALE.MINUTES.THREE,
    queryKey: createGetSuggestedUsersForSeeMoreQueryKey({
      category: props.category,
      limit: props.limit,
    }),
    queryFn: async () => {
      const contentLangs = getContentLanguages().join(',')
      const userInterests = aggregateUserInterests(preferences)

      const {data} = await agent.app.bsky.unspecced.getSuggestedUsersForSeeMore(
        {
          category: props.category ?? undefined,
          limit: props.limit || 50,
        },
        {
          headers: {
            ...createBskyTopicsHeader(userInterests),
            'Accept-Language': contentLangs,
          },
        },
      )

      if (!data.recIdStr) {
        logger.debug('getSuggestedUsersForSeeMore response missing recIdStr')
      }
      /*
       * TODO(phase4): drop toLex once this unspecced endpoint migrates off the
       * bridge agent (intentionally left on the bridge in Phase 3).
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
    queryKey: [getSuggestedUsersForSeeMoreQueryKeyRoot],
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
