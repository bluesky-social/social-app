import {type QueryClient, useInfiniteQuery} from '@tanstack/react-query'

import {useAgent} from '#/state/session'

export const RQKEY_ROOT = 'actor-starter-packs'
export const RQKEY_WITH_MEMBERSHIP_ROOT = 'actor-starter-packs-with-membership'
export const RQKEY = (did?: string) => [RQKEY_ROOT, did]
export const RQKEY_WITH_MEMBERSHIP = (did?: string) => [
  RQKEY_WITH_MEMBERSHIP_ROOT,
  did,
]

export function useActorStarterPacksQuery({
  did,
  enabled = true,
}: {
  did?: string
  enabled?: boolean
}) {
  const agent = useAgent()

  return useInfiniteQuery({
    queryKey: RQKEY(did),
    queryFn: async ({pageParam}: {pageParam?: string}) => {
      const res = await agent.app.bsky.graph.getActorStarterPacks({
        actor: did!,
        limit: 10,
        cursor: pageParam,
      })
      return res.data
    },
    enabled: Boolean(did) && enabled,
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.cursor,
  })
}

export function useActorStarterPacksWithMembershipsQuery({
  did,
  enabled = true,
}: {
  did?: string
  enabled?: boolean
}) {
  const agent = useAgent()

  return useInfiniteQuery({
    queryKey: RQKEY_WITH_MEMBERSHIP(did),
    queryFn: async ({pageParam}: {pageParam?: string}) => {
      const res = await agent.app.bsky.graph.getStarterPacksWithMembership({
        actor: did!,
        limit: 10,
        cursor: pageParam,
      })
      return res.data
    },
    enabled: Boolean(did) && enabled,
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.cursor,
  })
}

export async function invalidateActorStarterPacksQuery({
  queryClient,
  did,
}: {
  queryClient: QueryClient
  did: string
}) {
  await queryClient.invalidateQueries({queryKey: RQKEY(did)})
}

export async function invalidateActorStarterPacksWithMembershipQuery({
  queryClient,
  did,
}: {
  queryClient: QueryClient
  did: string
}) {
  await queryClient.invalidateQueries({queryKey: RQKEY_WITH_MEMBERSHIP(did)})
}
