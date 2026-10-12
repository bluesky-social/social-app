import {useQuery} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {createQueryKey} from '#/state/queries/util'
import {useAppviewClient} from '#/state/session'
import {getAtmosphereExploreTab} from './exploreApi'

export const useAtmosphereExploreQueryRoot = 'useAtmosphereExploreQuery'

export function useAtmosphereExploreQuery() {
  const client = useAppviewClient()

  return useQuery({
    queryKey: createQueryKey(useAtmosphereExploreQueryRoot, {did: client.did}),
    staleTime: STALE.MINUTES.FIVE,
    queryFn: ({signal}) => client.call(getAtmosphereExploreTab, {}, {signal}),
  })
}
