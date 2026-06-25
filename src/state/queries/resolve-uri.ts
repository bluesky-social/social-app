import {type AtpAgent, AtUri} from '@atproto/api'
import {type QueryClient, queryOptions, useQuery} from '@tanstack/react-query'

import {PUBLIC_APPVIEW} from '#/lib/constants'
import {STALE} from '#/state/queries'
import {useAgent} from '#/state/session'
import {useUnstableProfileViewCache} from './profile'

const RQKEY_ROOT = 'resolved-did'
export const RQKEY = (didOrHandle: string) => [RQKEY_ROOT, didOrHandle]

const resolvedDidQueryOptions = (
  agent: AtpAgent,
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

      try {
        const res = await agent.resolveHandle({handle: didOrHandle})
        return res.data.did
      } catch (err) {
        const did = await resolveHandleViaAppView(didOrHandle)
        if (did) return did
        throw err
      }
    },
    // @ts-expect-error tanstack 5.25 types require InitialDataFunction to
    // return `string`, but we want `undefined` to fall through to queryFn
    // unless the profile cache already has a resolved DID. Returning '' in
    // the falsy case makes tanstack treat the query as "has data" and skip
    // the fetch, which leaves the AtUri downstream with an empty host.
    initialData: () => {
      if (!didOrHandle) return undefined
      const profile = getUnstableProfile(didOrHandle)
      return profile?.did
    },
    enabled: !!didOrHandle,
    retry: false,
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

async function resolveHandleViaAppView(
  handle: string,
): Promise<string | undefined> {
  try {
    const res = await fetch(
      `${PUBLIC_APPVIEW}/xrpc/com.atproto.identity.resolveHandle?handle=${encodeURIComponent(handle)}`,
    )
    if (!res.ok) return undefined
    const data = (await res.json()) as {did?: string}
    return data.did
  } catch {
    return undefined
  }
}

export function precacheResolvedUri(
  queryClient: QueryClient,
  handle: string,
  did: string,
) {
  queryClient.setQueryData<string>(RQKEY(handle), did)
}
