import {AppBskyActorDefs} from '@atproto/api'
import {QueryClient, useQuery} from '@tanstack/react-query'

import {getAgent} from '#/state/session'
import {STALE} from '#/state/queries'

export const RQKEY = (prefix: string) => ['actor-search', prefix]

export function useActorSearch(prefix: string) {
  return useQuery<AppBskyActorDefs.ProfileView[]>({
    staleTime: STALE.MINUTES.ONE,
    queryKey: RQKEY(prefix || ''),
    async queryFn() {
      const res = await getAgent().searchActors({
        term: prefix,
      })
      return res.data.actors
    },
    enabled: !!prefix,
  })
}

export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
) {
  const queryDatas = queryClient.getQueriesData<AppBskyActorDefs.ProfileView[]>(
    {
      queryKey: ['actor-search'],
    },
  )
  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData) {
      continue
    }
    for (const actor of queryData) {
      if (actor.did === did) {
        yield actor
      }
    }
  }
}
