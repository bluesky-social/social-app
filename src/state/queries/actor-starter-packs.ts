import {type DidString} from '@atproto/syntax'
import {type QueryClient, useInfiniteQuery} from '@tanstack/react-query'

import {useAppviewClient} from '#/state/session'
import {app} from '#/lexicons'

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
  const client = useAppviewClient()

  return useInfiniteQuery({
    queryKey: RQKEY(did),
    queryFn: async ({pageParam}: {pageParam?: string}) => {
      return await client.call(app.bsky.graph.getActorStarterPacks, {
        // the enabled flag prevents this from running until did is set
        actor: did! as DidString,
        limit: 10,
        cursor: pageParam,
      })
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
  const client = useAppviewClient()

  return useInfiniteQuery({
    queryKey: RQKEY_WITH_MEMBERSHIP(did),
    queryFn: async ({pageParam}: {pageParam?: string}) => {
      return await client.call(app.bsky.graph.getStarterPacksWithMembership, {
        // the enabled flag prevents this from running until did is set
        actor: did! as DidString,
        limit: 10,
        cursor: pageParam,
      })
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
