/**
 * Resolve a user's PDS service endpoint from their handle/DID.
 *
 * Eurosky fork: the password sign-in flow deliberately has no hosting-
 * provider picker (most users are on the Bluesky PDS or Eurosky's own PDS).
 * `com.atproto.server.createSession` must hit the account's actual PDS, so we
 * resolve it: handle -> DID -> DID doc -> `#atproto_pds` serviceEndpoint.
 *
 * The actual resolution is delegated to the hardened OAuth identity resolver
 * (`identity-resolver.ts`), which adds DoH + `.well-known/atproto-did`
 * fallbacks for handles the AppView can't resolve and a server-side did:web
 * fallback for hosts that don't send CORS headers. Sharing it keeps the
 * password and OAuth sign-in paths resolving identically - this file used to
 * do a plain browser fetch for did:web, which the browser CORS-blocks, so a
 * custom-domain account could OAuth-login yet fail password-login.
 *
 * Because the fork removed the provider picker there is no fallback UI, so the
 * whole resolution is bounded by `RESOLVE_PDS_TIMEOUT_MS`; without it a hung
 * plc.directory or did:web host would spin the Sign in button forever.
 */
import {BSKY_SERVICE} from '#/lib/constants'
import {
  getPdsServiceUrlFromIdentityInfo,
  resolveIdentityUsingAppView,
} from './identity-resolver'

/** Upper bound on the whole handle -> PDS resolution, fallbacks included. */
const RESOLVE_PDS_TIMEOUT_MS = 8e3

export type ResolvePdsErrorReason = 'invalid_handle' | 'not_found' | 'timeout'

/**
 * Thrown when a handle/DID can't be resolved to a PDS. Carries a machine
 * `reason` so the sign-in screen can show a friendly, localized message
 * instead of the raw resolver error.
 */
export class ResolvePdsError extends Error {
  reason: ResolvePdsErrorReason
  cause?: unknown

  constructor(reason: ResolvePdsErrorReason, message: string, cause?: unknown) {
    super(message)
    this.name = 'ResolvePdsError'
    this.reason = reason
    this.cause = cause
  }
}

function createTimeoutSignal(ms: number) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  return {signal: controller.signal, cancel: () => clearTimeout(timer)}
}

async function resolve(actor: string): Promise<{did: string; pds: string}> {
  const {signal, cancel} = createTimeoutSignal(RESOLVE_PDS_TIMEOUT_MS)
  try {
    const identity = await resolveIdentityUsingAppView(actor, signal)
    const pds = getPdsServiceUrlFromIdentityInfo(identity)
    if (!pds) {
      throw new ResolvePdsError(
        'not_found',
        `No atproto PDS endpoint in DID document for ${identity.did}`,
      )
    }
    return {did: identity.did, pds}
  } catch (e) {
    if (e instanceof ResolvePdsError) throw e
    if (signal.aborted) {
      throw new ResolvePdsError(
        'timeout',
        `Timed out resolving the PDS for "${actor}"`,
        e,
      )
    }
    const message = e instanceof Error ? e.message : String(e)
    const reason: ResolvePdsErrorReason = message.includes('Invalid handle')
      ? 'invalid_handle'
      : 'not_found'
    throw new ResolvePdsError(reason, message, e)
  } finally {
    cancel()
  }
}

/**
 * Returns the PDS base URL to pass as `service` to session.login().
 *
 * Email identifiers can't be resolved to a PDS (no handle), so they fall back
 * to the default entryway - acceptable since email login is rare and only
 * meaningful for accounts hosted on that entryway anyway.
 */
export async function resolvePdsFromIdentifier(
  identifier: string,
): Promise<string> {
  const id = identifier.trim().replace(/^@/, '').toLowerCase()

  if (id.includes('@')) {
    // looks like an email - can't resolve, use the default entryway
    return BSKY_SERVICE
  }

  const {pds} = await resolve(id)
  return pds
}

/**
 * Resolves an actor (handle or DID) to both its DID and its PDS endpoint.
 *
 * Useful for reading a record straight from the repo that owns it (a PDS only
 * serves `com.atproto.repo.getRecord` for repos it hosts), instead of the
 * viewer's own PDS or the appview.
 */
export async function resolveDidAndPds(
  actor: string,
): Promise<{did: string; pds: string}> {
  const id = actor.trim().replace(/^@/, '')
  return resolve(id)
}
