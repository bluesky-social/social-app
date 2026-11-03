import {useQuery} from '@tanstack/react-query'

import {GCTIME, STALE} from '#/state/queries'
import {createQueryKey} from '#/state/queries/util'
import {useAppviewClient} from '#/state/session'
import {app} from '#/lexicons'

export const useAtmosphereAppsQueryRoot = 'useAtmosphereAppsQuery'

/**
 * Fetches every curated app once. The endpoint also accepts a `category`, but
 * we deliberately omit it and filter the response in memory instead.
 */
export function useAtmosphereAppsQuery() {
  const client = useAppviewClient()

  return useQuery({
    queryKey: createQueryKey(useAtmosphereAppsQueryRoot, {did: client.did}),
    /*
     * Memory-only. Only an explicit refetch (pull-to-refresh or error retry)
     * replaces a successful response.
     */
    staleTime: STALE.INFINITY,
    gcTime: GCTIME.INFINITY,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
    queryFn: ({signal}) =>
      client.call(app.bsky.unspecced.getAtmosphereApps, {}, {signal}),
  })
}
