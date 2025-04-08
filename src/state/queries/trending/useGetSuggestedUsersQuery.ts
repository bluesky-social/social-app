import {
  type AppBskyActorDefs,
  type AppBskyUnspeccedGetSuggestedUsers,
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

export type QueryProps = {category?: string | null; enabled?: boolean}

export const getSuggestedUsersQueryKeyRoot = 'unspecced-suggested-users'
export const createGetSuggestedUsersQueryKey = (props: QueryProps) => [
  getSuggestedUsersQueryKeyRoot,
  props.category,
]

export function useGetSuggestedUsersQuery(props: QueryProps) {
  const agent = useAgent()
  const {data: preferences} = usePreferencesQuery()

  return useQuery({
    enabled: !!preferences && props.enabled,
    staleTime: STALE.MINUTES.THREE,
    queryKey: createGetSuggestedUsersQueryKey(props),
    queryFn: async () => {
      const contentLangs = getContentLanguages().join(',')
      const {data} = await agent.app.bsky.unspecced.getSuggestedUsers(
        {
          category: props.category ?? undefined,
          limit: 10,
        },
        {
          headers: {
            ...createBskyTopicsHeader(aggregateUserInterests(preferences)),
            'Accept-Language': contentLangs,
          },
        },
      )

      return data
    },
  })
}

export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
): Generator<AppBskyActorDefs.ProfileView, void> {
  const responses =
    queryClient.getQueriesData<AppBskyUnspeccedGetSuggestedUsers.OutputSchema>({
      queryKey: [getSuggestedUsersQueryKeyRoot],
    })
  for (const [_, response] of responses) {
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
