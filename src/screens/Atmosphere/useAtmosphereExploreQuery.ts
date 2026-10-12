import {useQuery} from '@tanstack/react-query'

import {useLanguagePrefs} from '#/state/preferences/languages'
import {STALE} from '#/state/queries'
import {createQueryKey} from '#/state/queries/util'
import {useAppviewClient} from '#/state/session'
import {getAtmosphereExploreTab} from './exploreApi'

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
    staleTime: STALE.MINUTES.FIVE,
    queryFn: ({signal}) =>
      client.call(
        getAtmosphereExploreTab,
        {},
        {signal, headers: {'Accept-Language': acceptLanguage}},
      ),
  })
}
