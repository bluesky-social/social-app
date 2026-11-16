import {useQuery} from '@tanstack/react-query'
import shuffle from 'lodash.shuffle'

import {createQueryKey} from '#/state/queries/util'
import {useAppviewClient} from '#/state/session'
import {app} from '#/lexicons'

export const useAtmosphereAppsQueryRoot = 'useAtmosphereAppsQuery'

/**
 * Module-level so its identity is stable: the shuffle reruns only when the
 * fetched data changes, not on every render, and the cache stays unshuffled.
 */
function shuffleApps(data: app.bsky.unspecced.getAtmosphereApps.$OutputBody) {
  return {...data, apps: shuffle(data.apps)}
}

/**
 * Fetches the full curated apps catalog, in a random order per observer. The
 * endpoint also accepts a `category`, but we omit it and filter the response in
 * memory instead.
 */
export function useAtmosphereAppsQuery() {
  const client = useAppviewClient()

  return useQuery({
    queryKey: createQueryKey(useAtmosphereAppsQueryRoot, {did: client.did}),
    retry: 1,
    queryFn: ({signal}) =>
      client.call(app.bsky.unspecced.getAtmosphereApps, {}, {signal}),
    select: shuffleApps,
  })
}
