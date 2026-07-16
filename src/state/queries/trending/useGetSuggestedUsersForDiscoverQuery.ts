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
  limit?: number
}

export const getSuggestedUsersForDiscoverQueryKeyRoot =
  'unspecced-suggested-users-for-explore'
export const createGetSuggestedUsersForDiscoverQueryKey = (props: {
  limit?: number
}) => [getSuggestedUsersForDiscoverQueryKeyRoot, props.limit]

export function useGetSuggestedUsersForDiscoverQuery(props: QueryProps = {}) {
  const agent = useAgent()
  const {data: preferences} = usePreferencesQuery()

  return useQuery({
    staleTime: STALE.MINUTES.THREE,
    queryKey: createGetSuggestedUsersForDiscoverQueryKey({limit: props.limit}),
    queryFn: async () => {
      const contentLangs = getContentLanguages().join(',')
      const userInterests = aggregateUserInterests(preferences)

      const {data} =
        await agent.app.bsky.unspecced.getSuggestedUsersForDiscover(
          {
            limit: props.limit || 10,
          },
          {
            headers: {
              ...createBskyTopicsHeader(userInterests),
              'Accept-Language': contentLangs,
            },
          },
        )
      if (!data.recIdStr) {
        logger.debug('getSuggestedUsersForDiscover response missing recIdStr')
      }
      /*
       * TODO(phase4): drop toLex once getSuggestedUsersForDiscover migrates off
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
    queryKey: [getSuggestedUsersForDiscoverQueryKeyRoot],
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
