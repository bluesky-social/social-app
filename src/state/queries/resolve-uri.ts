import {AtUri, type BskyAgent} from '@atproto/api'
import {type QueryClient, queryOptions, useQuery} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {useAgent} from '#/state/session'
import {useUnstableProfileViewCache} from './profile'

const RQKEY_ROOT = 'resolved-did'
export const RQKEY = (didOrHandle: string) => [RQKEY_ROOT, didOrHandle]

const resolvedDidQueryOptions = (
  agent: BskyAgent,
  getUnstableProfile: (did: string) => {did: string} | undefined,
  didOrHandle: string | undefined,
) =>
  queryOptions({
    staleTime: STALE.HOURS.ONE,
    queryKey: RQKEY(didOrHandle ?? ''),
    queryFn: async () => {
      if (!didOrHandle) return ''
      // Just return the did if it's already one
      if (didOrHandle.startsWith('did:')) return didOrHandle

      const res = await agent.resolveHandle({handle: didOrHandle})
      return res.data.did
    },
    initialData: () => {
      // Return undefined if no did or handle
      if (!didOrHandle) return
      const profile = getUnstableProfile(didOrHandle)
      return profile?.did
    },
    enabled: !!didOrHandle,
  })

export function useResolveUriQuery(uri: string | undefined) {
  const urip = new AtUri(uri || '')
  const host = urip.host

  const agent = useAgent()
  const {getUnstableProfile} = useUnstableProfileViewCache()

  return useQuery({
    ...resolvedDidQueryOptions(agent, getUnstableProfile, host),
    select: did => ({
      did,
      uri: AtUri.make(did, urip.collection, urip.rkey).toString(),
    }),
  })
}

export function useResolveDidQuery(didOrHandle: string | undefined) {
  const agent = useAgent()
  const {getUnstableProfile} = useUnstableProfileViewCache()

  return useQuery(
    resolvedDidQueryOptions(agent, getUnstableProfile, didOrHandle),
  )
}

export function precacheResolvedUri(
  queryClient: QueryClient,
  handle: string,
  did: string,
) {
  queryClient.setQueryData<string>(RQKEY(handle), did)
}
