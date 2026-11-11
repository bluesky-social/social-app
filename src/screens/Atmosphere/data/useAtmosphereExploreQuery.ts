import {useQuery} from '@tanstack/react-query'

import {
  aggregateUserInterests,
  createBskyAppviewHeaders,
  createBskyTopicsHeader,
} from '#/lib/api/feed/utils'
import {useLanguagePrefs} from '#/state/preferences/languages'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {createQueryKey} from '#/state/queries/util'
import {useAppviewClient} from '#/state/session'
import {app} from '#/lexicons'

export const useAtmosphereExploreQueryRoot = 'useAtmosphereExploreQuery'

export function useAtmosphereExploreQuery() {
  const client = useAppviewClient()
  const {contentLanguages} = useLanguagePrefs()
  const {data: preferences} = usePreferencesQuery()
  const acceptLanguage = contentLanguages.join(',')
  const userInterests = aggregateUserInterests(preferences)

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
  })
}
