import {useQuery} from '@tanstack/react-query'

import {createQueryKey} from '#/state/queries/util'
import {useAppviewClient} from '#/state/session'
import {app} from '#/lexicons'

export const useAtmosphereAppsQueryRoot = 'useAtmosphereAppsQuery'

/**
 * Fetches the full curated apps catalog. The endpoint also accepts a
 * `category`, but we omit it and filter the response in memory instead.
 */
export function useAtmosphereAppsQuery() {
  const client = useAppviewClient()

  return useQuery({
    queryKey: createQueryKey(useAtmosphereAppsQueryRoot, {did: client.did}),
    retry: 1,
    queryFn: ({signal}) =>
      client.call(app.bsky.unspecced.getAtmosphereApps, {}, {signal}),
  })
}
