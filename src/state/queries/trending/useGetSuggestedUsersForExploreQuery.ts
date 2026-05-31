import {
  type AppBskyActorDefs,
  type AppBskyUnspeccedGetSuggestedUsersForExplore,
} from '@atproto/api'
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

export type QueryProps = {
  category?: string | null
  limit?: number
}

export const getSuggestedUsersForExploreQueryKeyRoot =
  'unspecced-suggested-users-for-explore'
export const createGetSuggestedUsersForExploreQueryKey = (
  props: QueryProps,
) => [getSuggestedUsersForExploreQueryKeyRoot, props.category, props.limit]

export function useGetSuggestedUsersForExploreQuery(props: QueryProps = {}) {
  const agent = useAgent()
  const {data: preferences} = usePreferencesQuery()

  return useQuery({
    staleTime: STALE.MINUTES.THREE,
    queryKey: createGetSuggestedUsersForExploreQueryKey(props),
    queryFn: async () => {
      const contentLangs = getContentLanguages().join(',')
      const userInterests = aggregateUserInterests(preferences)

      const {data} = await agent.app.bsky.unspecced.getSuggestedUsersForExplore(
        {
          category: props.category ?? undefined,
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
        logger.debug('getSuggestedUsersForExplore response missing recIdStr')
      }
      return {...data, recId: data.recIdStr}
    },
  })
}

export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
): Generator<AppBskyActorDefs.ProfileView, void> {
  const responses =
    queryClient.getQueriesData<AppBskyUnspeccedGetSuggestedUsersForExplore.OutputSchema>(
      {
        queryKey: [getSuggestedUsersForExploreQueryKeyRoot],
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
