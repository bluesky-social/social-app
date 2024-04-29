import {AppBskyActorDefs} from '@atproto/api'
import {QueryClient, useQuery} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {useAgent} from '#/state/session'

const RQKEY_ROOT = 'actor-search'
export const RQKEY = (query: string) => [RQKEY_ROOT, query]

export function useActorSearch({
  query,
  enabled,
}: {
  query: string
  enabled?: boolean
}) {
  const {getAgent} = useAgent()
  return useQuery<AppBskyActorDefs.ProfileView[]>({
    staleTime: STALE.MINUTES.ONE,
    queryKey: RQKEY(query || ''),
    async queryFn() {
      const res = await getAgent().searchActors({
        q: query,
      })
      return res.data.actors
    },
    enabled: enabled && !!query,
  })
}

export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
) {
  const queryDatas = queryClient.getQueriesData<AppBskyActorDefs.ProfileView[]>(
    {
      queryKey: [RQKEY_ROOT],
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
