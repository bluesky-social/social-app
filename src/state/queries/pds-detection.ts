import {useState} from 'react'
import {type DidDocument, getPdsEndpoint} from '@atproto/common-web'
import {useQuery, useQueryClient} from '@tanstack/react-query'

import {DEFAULT_SERVICE, PUBLIC_BSKY_SERVICE} from '#/lib/constants'
import {useDebouncedValue} from '#/lib/hooks/useDebouncedValue'
import {isNetworkError} from '#/lib/strings/errors'
import {STALE} from '#/state/queries'
import {Agent} from '#/state/session/agent'

const RQKEY_ROOT = 'pds-detection'
export const RQKEY = (identifier: string) => [RQKEY_ROOT, identifier]

/**
 * Resolve a DID document without a session.
 *
 * `com.atproto.identity.resolveIdentity` would give us the DID doc in a single
 * call, but it requires auth on the entryway and is not implemented on the
 * appview, so it is unusable here. Instead we resolve the DID doc directly:
 * `did:plc` via the PLC directory, `did:web` via its `.well-known` endpoint.
 */
async function resolveDidDoc(did: string): Promise<DidDocument | null> {
  if (did.startsWith('did:plc:')) {
    const res = await fetch(`https://plc.directory/${did}`)
    if (!res.ok) return null
    return (await res.json()) as DidDocument
  }
  if (did.startsWith('did:web:')) {
    const domain = did.slice('did:web:'.length)
    /*
     * did:web method-specific ids are domains; a `:` would indicate a path
     * component, which the network does not support. Reject those rather than
     * building a malformed URL.
     */
    if (domain.includes(':')) return null
    const res = await fetch(
      `https://${decodeURIComponent(domain)}/.well-known/did.json`,
    )
    if (!res.ok) return null
    return (await res.json()) as DidDocument
  }
  return null
}

/**
 * Whether a PDS endpoint is operated by Bluesky. This covers the entryway
 * (bsky.social) and the `*.host.bsky.network` shards that back regular
 * Bluesky accounts. Accounts on these hosts should sign in via the entryway
 * (the default service), which routes to the correct shard internally, so
 * they are treated as "default" rather than a detected third-party provider.
 */
function isBlueskyHostedPds(pdsUrl: string): boolean {
  try {
    const {hostname} = new URL(pdsUrl)
    return (
      hostname === 'bsky.social' ||
      hostname === 'host.bsky.network' ||
      hostname.endsWith('.host.bsky.network')
    )
  } catch {
    return false
  }
}

/**
 * Resolve the third-party PDS endpoint that hosts a given identifier (handle
 * or DID).
 *
 * Returns the PDS URL, or `null` if the identifier resolves to a
 * Bluesky-operated host (use the entryway instead) or cannot be resolved to a
 * PDS at all (unknown handle, broken identity, unsupported DID method).
 * Rethrows only on genuine network errors, so a "not found" during typing
 * stays quiet.
 */
export async function resolvePdsForIdentifier(
  identifier: string,
): Promise<string | null> {
  const norm = identifier.toLowerCase().trim()
  const agent = new Agent(null, {service: PUBLIC_BSKY_SERVICE})
  try {
    let did: string
    if (norm.startsWith('did:')) {
      did = norm
    } else {
      const res = await agent.resolveHandle({handle: norm})
      did = res.data.did
    }
    const doc = await resolveDidDoc(did)
    if (!doc) return null
    const pds = getPdsEndpoint(doc)
    if (!pds || isBlueskyHostedPds(pds)) return null
    return pds
  } catch (err) {
    if (isNetworkError(err)) throw err
    return null
  }
}

/**
 * The detection lifecycle for a login identifier, derived from the debounced
 * resolution query plus any manual override.
 */
export type HostingProviderState =
  /** Empty, or not yet a plausible handle (e.g. a bare username). */
  | {status: 'idle'}
  /** The identifier is an email address, so PDS detection is skipped. */
  | {status: 'email'}
  /** A resolution query is in flight for the current identifier. */
  | {status: 'detecting'}
  /** Resolved to a non-default PDS. */
  | {status: 'detected'; pdsUrl: string}
  /** Resolved to the default PDS (or resolved to nothing usable). */
  | {status: 'default'}
  /** The handle did not resolve, or resolution failed quietly. */
  | {status: 'unresolved'}
  /** The user manually selected a provider. */
  | {status: 'overridden'; pdsUrl: string}

/**
 * Autodetects the hosting provider (PDS) for a login identifier as the user
 * types, with a manual override escape hatch.
 *
 * The effective `service` is `override ?? detected ?? defaultService`.
 * Detection never blocks submission: `resolveService` awaits any in-flight
 * detection against the current (non-debounced) identifier so that pressing
 * "Sign in" mid-detection waits for resolution and then continues.
 */
export function useHostingProvider({
  identifier,
  defaultService = DEFAULT_SERVICE,
}: {
  identifier: string
  defaultService?: string
}): {
  state: HostingProviderState
  service: string
  override: (url: string) => void
  clearOverride: () => void
  resolveService: (currentIdentifier: string) => Promise<string>
} {
  const queryClient = useQueryClient()
  const [override, setOverride] = useState<string | null>(null)

  const normalized = identifier.toLowerCase().trim()
  const isEmail = normalized.includes('@')
  const isPlausibleHandle =
    !!normalized &&
    !isEmail &&
    (normalized.includes('.') || normalized.startsWith('did:'))

  const debounced = useDebouncedValue(normalized, 500)
  const enabled = isPlausibleHandle && normalized === debounced

  const query = useQuery({
    enabled,
    queryKey: RQKEY(debounced),
    queryFn: () => resolvePdsForIdentifier(debounced),
    staleTime: STALE.MINUTES.FIVE,
  })

  let state: HostingProviderState
  if (override != null) {
    state = {status: 'overridden', pdsUrl: override}
  } else if (isEmail) {
    state = {status: 'email'}
  } else if (!isPlausibleHandle) {
    state = {status: 'idle'}
  } else if (query.isPending || query.isFetching) {
    state = {status: 'detecting'}
  } else if (query.isError || query.data == null) {
    state = {status: 'unresolved'}
  } else if (query.data === defaultService) {
    state = {status: 'default'}
  } else {
    state = {status: 'detected', pdsUrl: query.data}
  }

  const service =
    override ?? (state.status === 'detected' ? state.pdsUrl : defaultService)

  return {
    state,
    service,
    override: (url: string) => setOverride(url),
    clearOverride: () => setOverride(null),
    resolveService: async (currentIdentifier: string) => {
      if (override != null) return override
      const norm = currentIdentifier.toLowerCase().trim()
      // Emails and bare usernames can't resolve a PDS on their own.
      if (norm.includes('@')) return defaultService
      if (!norm.includes('.') && !norm.startsWith('did:')) return defaultService
      try {
        const pds = await queryClient.ensureQueryData({
          queryKey: RQKEY(norm),
          queryFn: () => resolvePdsForIdentifier(norm),
          staleTime: STALE.MINUTES.FIVE,
        })
        return pds ?? defaultService
      } catch {
        return defaultService
      }
    },
  }
}
