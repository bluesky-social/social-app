import {useState} from 'react'
import {type DidDocument, getPdsEndpoint} from '@atproto/common-web'
import {Client} from '@atproto/lex-client'
import {type HandleString} from '@atproto/syntax'
import {useQuery, useQueryClient} from '@tanstack/react-query'

import {DEFAULT_SERVICE, PUBLIC_BSKY_SERVICE} from '#/lib/constants'
import {useDebouncedValue} from '#/lib/hooks/useDebouncedValue'
import {isNetworkError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {STALE} from '#/state/queries'
import {com} from '#/lexicons'

const RQKEY_ROOT = 'pds-detection'
export const RQKEY = (identifier: string) => [RQKEY_ROOT, identifier]

/**
 * Normalize a login identifier for detection: lowercase, trim, and strip a
 * single leading `@`. Handles are often typed as `@alice.example.com`; without
 * stripping the `@` the identifier looks like an email and detection is
 * disabled. A real email (`a@b.com`) has no leading `@`, so it still contains
 * an `@` after normalization and classifies as an email correctly.
 */
function normalizeIdentifier(identifier: string): string {
  return identifier.trim().toLowerCase().replace(/^@/, '')
}

/**
 * Per-request timeout for identity/PDS resolution network calls. Without it a
 * hanging plc.directory / did:web `.well-known` fetch (or handle resolution)
 * could leave the sign-in button spinning indefinitely.
 */
const RESOLVE_TIMEOUT = 20e3

/**
 * Run a resolution network op with a per-request timeout. `run` receives an
 * `AbortSignal` that fires after `RESOLVE_TIMEOUT`, so callers that support
 * cancellation (fetch, the XRPC client) abort the in-flight request. A timeout
 * is surfaced as a network error so the caller fails the login rather than
 * silently falling back to the default service.
 */
async function withResolveTimeout<T>(
  run: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), RESOLVE_TIMEOUT)
  try {
    return await run(controller.signal)
  } catch (err) {
    if (controller.signal.aborted) {
      throw new Error('Network request failed: resolution timed out')
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Whether a non-ok HTTP status from an identity fetch is server-side or
 * transient (5xx or 429) rather than a genuine "not found / invalid" (other
 * 4xx). Transient statuses must not be treated as "identity doesn't exist",
 * since that would silently fall back to the default service.
 */
function isTransientHttpStatus(status: number): boolean {
  return status >= 500 || status === 429
}

/**
 * Resolve a DID document without a session.
 *
 * `com.atproto.identity.resolveIdentity` would give us the DID doc in a single
 * call, but it requires auth on the entryway and is not implemented on the
 * appview, so it is unusable here. Instead we resolve the DID doc directly:
 * `did:plc` via the PLC directory, `did:web` via its `.well-known` endpoint.
 *
 * Returns `null` for a genuine "not found / invalid" response (a 4xx or an
 * unsupported DID method). Throws a network error for transient server-side
 * failures (5xx, 429) so the caller fails the login rather than silently
 * submitting the password to the default service during, e.g., a plc.directory
 * blip.
 */
async function resolveDidDoc(
  did: string,
  signal?: AbortSignal,
): Promise<DidDocument | null> {
  if (did.startsWith('did:plc:')) {
    const res = await fetch(`https://plc.directory/${did}`, {signal})
    if (!res.ok) {
      logger.debug('pds-detection: plc.directory returned non-ok status', {
        did,
        status: res.status,
      })
      if (isTransientHttpStatus(res.status)) {
        throw new Error(
          `Network request failed: plc.directory returned ${res.status}`,
        )
      }
      return null
    }
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
      {signal},
    )
    if (!res.ok) {
      logger.debug(
        'pds-detection: did:web .well-known returned non-ok status',
        {
          did,
          status: res.status,
        },
      )
      if (isTransientHttpStatus(res.status)) {
        throw new Error(
          `Network request failed: did:web .well-known returned ${res.status}`,
        )
      }
      return null
    }
    return (await res.json()) as DidDocument
  }
  logger.debug('pds-detection: unsupported DID method', {did})
  return null
}

/**
 * Resolve the identity behind a given identifier (handle or DID).
 *
 * Returns the resolved DID together with the PDS URL declared by its DID
 * document (verbatim). `pdsUrl` is `null` when the DID resolved but its
 * document declares no PDS endpoint. Returns `null` altogether when the
 * identifier itself cannot be resolved (unknown handle, broken identity,
 * unsupported DID method).
 *
 * Rethrows only on genuine network errors, so a "not found" during typing
 * stays quiet.
 */
export async function resolvePdsForIdentifier(
  identifier: string,
): Promise<{did: string; pdsUrl: string | null} | null> {
  const norm = normalizeIdentifier(identifier)
  /*
   * Unauthenticated throwaway client pointed at the public appview -
   * resolveHandle is a public read.
   */
  const client = new Client({service: PUBLIC_BSKY_SERVICE})
  try {
    let did: string
    if (norm.startsWith('did:')) {
      did = norm
    } else {
      const res = await withResolveTimeout(signal =>
        client.call(
          com.atproto.identity.resolveHandle,
          {handle: norm as HandleString},
          {signal},
        ),
      )
      did = res.did
    }
    logger.debug('pds-detection: resolved identifier to DID', {
      identifier: norm,
      did,
    })
    const doc = await withResolveTimeout(signal => resolveDidDoc(did, signal))
    logger.debug('pds-detection: resolved DID doc', {
      did,
      foundDoc: !!doc,
    })
    if (!doc) return null
    const pds = getPdsEndpoint(doc)
    logger.debug('pds-detection: got PDS endpoint', {
      did,
      pds: pds ?? null,
    })
    return {did, pdsUrl: pds ?? null}
  } catch (err) {
    logger.debug('pds-detection: resolution failed', {
      identifier: norm,
      error: String(err),
      isNetworkError: isNetworkError(err),
    })
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
  /** Resolved to a PDS endpoint. */
  | {status: 'detected'; pdsUrl: string}
  /**
   * The handle genuinely did not resolve (unknown handle, broken identity).
   * This is the only state that should admonish the user about typos.
   */
  | {status: 'unresolved'}
  /**
   * Resolution failed for a network/transient reason (offline, plc.directory
   * 5xx). Distinct from `unresolved` because it is not evidence the handle is
   * invalid, so the UI must not suggest a typo. Pressing "Sign in" surfaces the
   * connectivity error via `resolveService` re-throwing.
   */
  | {status: 'error'}
  /** The user manually selected a provider. */
  | {status: 'overridden'; pdsUrl: string}

/**
 * Autodetects the hosting provider (PDS) for a login identifier as the user
 * types, with a manual override escape hatch.
 *
 * The effective `service` is `override ?? detected ?? defaultService`.
 * `resolveService` awaits any in-flight detection against the current
 * (non-debounced) identifier so that pressing "Sign in" mid-detection waits
 * for resolution and then continues. It resolves to `{service, did}`: the
 * service to log in against, plus the identifier's resolved DID (`null` when
 * no DID was resolved - manual override, email, or bare username). It falls
 * back to `defaultService` for anything that legitimately can't resolve a PDS
 * (emails, bare usernames, unknown handles) but rethrows genuine network
 * errors, so a flaky connection fails the login instead of silently
 * submitting to the default server.
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
  resolveService: (
    currentIdentifier: string,
  ) => Promise<{service: string; did: string | null}>
} {
  const queryClient = useQueryClient()
  const [override, setOverride] = useState<string | null>(null)

  const normalized = normalizeIdentifier(identifier)
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
  } else if (normalized !== debounced) {
    /*
     * The identifier changed but the debounce hasn't caught up, so the query is
     * still keyed on the old value. Report 'detecting' rather than the stale
     * query state, which would otherwise show the previous handle's PDS as
     * 'detected'.
     */
    state = {status: 'detecting'}
  } else if (query.isPending || query.isFetching) {
    state = {status: 'detecting'}
  } else if (query.isError && isNetworkError(query.error)) {
    /*
     * A network/transient failure is not evidence the handle is invalid, so
     * report 'error' instead of 'unresolved' to avoid a misleading typo hint.
     */
    state = {status: 'error'}
  } else if (query.isError || query.data == null || query.data.pdsUrl == null) {
    state = {status: 'unresolved'}
  } else {
    state = {status: 'detected', pdsUrl: query.data.pdsUrl}
  }

  const service =
    override ?? (state.status === 'detected' ? state.pdsUrl : defaultService)

  return {
    state,
    service,
    override: (url: string) => setOverride(url),
    clearOverride: () => setOverride(null),
    resolveService: async (currentIdentifier: string) => {
      if (override != null) return {service: override, did: null}
      const norm = normalizeIdentifier(currentIdentifier)
      // Emails and bare usernames can't resolve a PDS on their own.
      if (norm.includes('@')) return {service: defaultService, did: null}
      if (!norm.includes('.') && !norm.startsWith('did:')) {
        return {service: defaultService, did: null}
      }
      /*
       * `resolvePdsForIdentifier` only throws on genuine network errors;
       * anything unresolvable (unknown handle, broken identity) resolves to
       * `null`, which we treat as the default service. Network errors are left
       * to propagate so the caller can fail the login rather than silently
       * submit the password to the wrong server.
       */
      const resolved = await queryClient.ensureQueryData({
        queryKey: RQKEY(norm),
        queryFn: () => resolvePdsForIdentifier(norm),
        staleTime: STALE.MINUTES.FIVE,
      })
      // The DID is known even when its doc declares no PDS endpoint.
      return {
        service: resolved?.pdsUrl ?? defaultService,
        did: resolved?.did ?? null,
      }
    },
  }
}
