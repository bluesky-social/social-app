import {useQuery} from '@tanstack/react-query'

import {
  type DidDocument,
  didDocumentUrl,
  extractPdsEndpoint,
  looksLikeHandle,
} from '#/lib/api/pds-from-handle'
import {STALE} from '#/state/queries'
import {Agent} from '../session/agent'

export {looksLikeHandle} from '#/lib/api/pds-from-handle'

const RQKEY_ROOT = 'pds-from-handle'
export const RQKEY = (handle: string) => [RQKEY_ROOT, handle]

/**
 * Resolve a handle to its hosting provider (PDS) URL by walking the DID
 * document. Returns `null` if the handle's PDS cannot be determined.
 *
 * The resolution is two hops:
 *   1. handle -> DID via com.atproto.identity.resolveHandle on the public AppView
 *   2. DID    -> PDS by fetching the DID document and reading the
 *                AtprotoPersonalDataServer service entry.
 */
export async function resolvePdsFromHandle(
  handle: string,
): Promise<string | null> {
  const did = await resolveHandleToDid(handle)
  if (!did) return null
  const doc = await fetchDidDocument(did)
  if (!doc) return null
  return extractPdsEndpoint(doc)
}

async function resolveHandleToDid(handle: string): Promise<string | null> {
  // Use an unauthenticated agent against the public AppView so this works
  // pre-login — the PDS isn't known yet, so we can't hit it directly.
  const agent = new Agent(null, {service: 'https://public.api.bsky.app'})
  try {
    const res = await agent.com.atproto.identity.resolveHandle({handle})
    return res.data.did ?? null
  } catch {
    return null
  }
}

async function fetchDidDocument(did: string): Promise<DidDocument | null> {
  const url = didDocumentUrl(did)
  if (!url) return null
  try {
    const res = await fetch(url, {headers: {accept: 'application/json'}})
    if (!res.ok) return null
    return (await res.json()) as DidDocument
  } catch {
    return null
  }
}

/**
 * Query the PDS for a handle. Enabled only when the input looks like a
 * fully-qualified handle (contains a dot, no '@'). Result is cached
 * indefinitely — a handle's PDS rarely changes, and if it does the user
 * can still override the hosting provider manually.
 */
export function usePdsFromHandleQuery(handle: string) {
  return useQuery({
    staleTime: STALE.INFINITY,
    queryKey: RQKEY(handle),
    queryFn: () => resolvePdsFromHandle(handle),
    enabled: looksLikeHandle(handle),
    retry: false,
  })
}
