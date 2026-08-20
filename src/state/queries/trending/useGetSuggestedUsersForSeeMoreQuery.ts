import {type QueryClient, useQuery} from '@tanstack/react-query'

import {
  aggregateUserInterests,
  createBskyTopicsHeader,
} from '#/lib/api/feed/utils'
import {logger} from '#/logger'
import {getContentLanguages} from '#/state/preferences/languages'
import {STALE} from '#/state/queries'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {useAppviewClient} from '#/state/session'
import type * as AppBskyActorDefs from '#/lexicons/app/bsky/actor/defs'
import * as AppBskyUnspeccedGetSuggestedUsersForSeeMore from '#/lexicons/app/bsky/unspecced/getSuggestedUsersForSeeMore'

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
  const client = useAppviewClient()
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

      const data = await client.call(
        AppBskyUnspeccedGetSuggestedUsersForSeeMore,
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
      return {...data, recId: data.recIdStr}
    },
  })
}

export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
): Generator<AppBskyActorDefs.ProfileView, void> {
  const responses =
    queryClient.getQueriesData<AppBskyUnspeccedGetSuggestedUsersForSeeMore.$OutputBody>(
      {
        queryKey: [getSuggestedUsersForSeeMoreQueryKeyRoot],
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
