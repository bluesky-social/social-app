import {useQuery} from '@tanstack/react-query'

import {useLanguagePrefs} from '#/state/preferences/languages'
import {GCTIME, STALE} from '#/state/queries'
import {createQueryKey} from '#/state/queries/util'
import {useAppviewClient} from '#/state/session'
import {app} from '#/lexicons'

export const useAtmosphereExploreQueryRoot = 'useAtmosphereExploreQuery'

export function useAtmosphereExploreQuery() {
  const client = useAppviewClient()
  const {contentLanguages} = useLanguagePrefs()
  const acceptLanguage = contentLanguages.join(',')

  return useQuery({
    queryKey: createQueryKey(useAtmosphereExploreQueryRoot, {
      did: client.did,
      acceptLanguage,
    }),
    /*
     * Memory-only and shared by the Explore and Apps tabs. Only an explicit
     * refetch (pull-to-refresh or error retry) replaces a successful response.
     */
    staleTime: STALE.INFINITY,
    gcTime: GCTIME.INFINITY,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
    queryFn: ({signal}) =>
      client.call(
        app.bsky.unspecced.getAtmosphereExploreTab,
        contentLanguages.length ? {langs: contentLanguages} : {},
        {signal, headers: {'Accept-Language': acceptLanguage}},
      ),
  })
}
