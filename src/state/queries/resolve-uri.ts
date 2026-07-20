import {type Client} from '@atproto/lex'
import {AtUri, type HandleString} from '@atproto/syntax'
import {type QueryClient, queryOptions, useQuery} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {useAppviewClient} from '#/state/session'
import {com} from '#/lexicons'
import {useUnstableProfileViewCache} from './profile'

const RQKEY_ROOT = 'resolved-did'
export const RQKEY = (didOrHandle: string) => [RQKEY_ROOT, didOrHandle]

const resolvedDidQueryOptions = (
  client: Client,
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

      const {did} = await client.call(com.atproto.identity.resolveHandle, {
        handle: didOrHandle as HandleString,
      })
      return did
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

  const client = useAppviewClient()
  const {getUnstableProfile} = useUnstableProfileViewCache()

  return useQuery({
    ...resolvedDidQueryOptions(client, getUnstableProfile, host),
    select: did => ({
      did,
      uri: AtUri.make(did, urip.collection, urip.rkey).toString(),
    }),
  })
}

export function useResolveDidQuery(didOrHandle: string | undefined) {
  const client = useAppviewClient()
  const {getUnstableProfile} = useUnstableProfileViewCache()

  return useQuery(
    resolvedDidQueryOptions(client, getUnstableProfile, didOrHandle),
  )
}

export function precacheResolvedUri(
  queryClient: QueryClient,
  handle: string,
  did: string,
) {
  queryClient.setQueryData<string>(RQKEY(handle), did)
}
