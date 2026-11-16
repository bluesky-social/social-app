import {type QueryClient, useQuery} from '@tanstack/react-query'

import {
  aggregateUserInterests,
  createBskyAppviewHeaders,
  createBskyTopicsHeader,
} from '#/lib/api/feed/utils'
import {useApplyProfileShadow} from '#/state/cache/profile-shadow'
import {useLanguagePrefs} from '#/state/preferences/languages'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {createQueryKey} from '#/state/queries/util'
import {useAppviewClient} from '#/state/session'
import {app} from '#/lexicons'
import type * as bsky from '#/types/bsky'
import {findProfiles, mapExploreProfiles} from './mapProfiles'

export const useAtmosphereExploreQueryRoot = 'useAtmosphereExploreQuery'

/**
 * The Explore tab's data, with profile shadows applied in `select` so mutes
 * and blocks made elsewhere re-filter it without a refetch.
 */
export function useAtmosphereExploreQuery() {
  const client = useAppviewClient()
  const {contentLanguages} = useLanguagePrefs()
  const {data: preferences} = usePreferencesQuery()
  const acceptLanguage = contentLanguages.join(',')
  const userInterests = aggregateUserInterests(preferences)
  const applyProfileShadow = useApplyProfileShadow()

  return useQuery({
    queryKey: createQueryKey(useAtmosphereExploreQueryRoot, {
      did: client.did,
      acceptLanguage,
      userInterests,
    }),
    retry: 1,
    queryFn: ({signal}) =>
      client.call(
        app.bsky.unspecced.getAtmosphereExploreTab,
        contentLanguages.length ? {langs: contentLanguages} : {},
        {
          signal,
          headers: {
            ...createBskyAppviewHeaders(),
            ...createBskyTopicsHeader(userInterests),
            'Accept-Language': acceptLanguage,
          },
        },
      ),
    select: data => mapExploreProfiles(data, applyProfileShadow),
  })
}

export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
): Generator<bsky.profile.AnyProfileView, void> {
  const queryDatas =
    queryClient.getQueriesData<app.bsky.unspecced.getAtmosphereExploreTab.$OutputBody>(
      {queryKey: [useAtmosphereExploreQueryRoot]},
    )
  for (const [, data] of queryDatas) {
    if (data) yield* findProfiles(did, map => mapExploreProfiles(data, map))
  }
}
