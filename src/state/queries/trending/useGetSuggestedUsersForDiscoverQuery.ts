import {
  type AppBskyActorDefs,
  type AppBskyUnspeccedGetSuggestedUsersForDiscover,
} from '@atproto/api'
import {type QueryClient, useQuery} from '@tanstack/react-query'

import {
  aggregateUserInterests,
  createBskyTopicsHeader,
} from '#/lib/api/feed/utils'
import {getContentLanguages} from '#/state/preferences/languages'
import {STALE} from '#/state/queries'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {useAgent} from '#/state/session'

export type QueryProps = {
  limit?: number
  enabled?: boolean
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
    enabled: props.enabled ?? true,
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
      return {...data, recId: data.recIdStr}
    },
  })
}

export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
): Generator<AppBskyActorDefs.ProfileView, void> {
  const responses =
    queryClient.getQueriesData<AppBskyUnspeccedGetSuggestedUsersForDiscover.OutputSchema>(
      {
        queryKey: [getSuggestedUsersForDiscoverQueryKeyRoot],
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

/**
 * Collects every DID currently cached under any `getSuggestedUsersForDiscover`
 * query. Used by the See More dialog's For You tab to filter out profiles the
 * viewer has already been shown by the home-feed interstitial (the endpoint
 * has no cursor/offset, so we dedup client-side).
 *
 * The query key root is shared with `getSuggestedUsersForSeeMore`, so we
 * narrow by key length (Discover keys are `[root, limit]`, SeeMore keys are
 * `[root, category, limit]`).
 */
export function getAllDidsInDiscoverCache(
  queryClient: QueryClient,
): Set<string> {
  const dids = new Set<string>()
  const responses =
    queryClient.getQueriesData<AppBskyUnspeccedGetSuggestedUsersForDiscover.OutputSchema>(
      {
        queryKey: [getSuggestedUsersForDiscoverQueryKeyRoot],
      },
    )
  for (const [key, response] of responses) {
    if (!response) continue
    if (key.length !== 2) continue
    for (const actor of response.actors) {
      dids.add(actor.did)
    }
  }
  return dids
}
