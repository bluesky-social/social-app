import {type SessionData} from '@atproto/lex-password-session'
import {jwtDecode} from 'jwt-decode'

import {BSKY_SERVICE} from '#/lib/constants'
import {isJwtExpired} from '#/lib/jwt'
import {hasProp} from '#/lib/type-guards'
import {type SessionAccount} from './types'

/**
 * The PDS endpoint declared by a DID document, or `undefined`.
 *
 * This deliberately mirrors `extractPdsUrl` in `@atproto/lex-password-session`,
 * the predicate `PasswordSession` uses to route its own requests: the first
 * service entry whose `id` ends with `#atproto_pds`, taking its
 * `serviceEndpoint` if it parses as a URL. A stricter predicate here (schema
 * validation, `type` checks) would let the PERSISTED `pdsUrl` disagree with
 * the host the live session actually routes to, so the next cold start would
 * seed the wrong endpoint.
 */
function extractPdsUrl(didDoc: SessionData['didDoc']): string | undefined {
  const services = prop(didDoc, 'service')
  if (!Array.isArray(services)) {
    return undefined
  }
  const pds = services.find(service => {
    const id = prop(service, 'id')
    return typeof id === 'string' && id.endsWith('#atproto_pds')
  })
  const endpoint = prop(pds, 'serviceEndpoint')
  return typeof endpoint === 'string' && URL.canParse(endpoint)
    ? endpoint
    : undefined
}

/**
 * Read a property off an unknown value the way JS optional chaining would,
 * without narrowing assumptions about the shape of a `LexMap`.
 */
function prop(value: unknown, key: string): unknown {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)[key]
    : undefined
}

/** Whether an access token was issued for a queued (waitlisted) signup. */
export function isSignupQueued(accessJwt: string | undefined) {
  if (accessJwt) {
    const sessData = jwtDecode(accessJwt)
    return (
      hasProp(sessData, 'scope') &&
      sessData.scope === 'com.atproto.signupQueued'
    )
  }
  return false
}

/**
 * Convert live `PasswordSession` session data into the persisted
 * `SessionAccount` snapshot.
 *
 * The object literal's field order is load-bearing: the reducer's
 * `JSON.stringify` fast path and the session test snapshots depend on
 * byte-stable serialization. `service` and `pdsUrl` are normalized through
 * `new URL().toString()` for a stable trailing slash.
 *
 * `pdsUrl` comes from the DID document or a pre-refresh stored value. It does
 * not fall back to the login service.
 */
export function sessionDataToSessionAccount(
  session: SessionData | null | undefined,
  service: string,
  storedPdsUrl?: string,
): SessionAccount | undefined {
  if (!session) {
    return undefined
  }
  const normalizedService = new URL(service).toString()
  const pdsUrl = extractPdsUrl(session.didDoc) ?? storedPdsUrl
  return {
    service: normalizedService,
    did: session.did,
    handle: session.handle,
    email: session.email,
    emailConfirmed: session.emailConfirmed || false,
    emailAuthFactor: session.emailAuthFactor || false,
    refreshJwt: session.refreshJwt,
    accessJwt: session.accessJwt,
    signupQueued: isSignupQueued(session.accessJwt),
    active: session.active,
    status: session.status,
    pdsUrl: pdsUrl ? new URL(pdsUrl).toString() : undefined,
    isSelfHosted: !normalizedService.startsWith(BSKY_SERVICE),
  }
}

/** Convert a persisted account into data suitable for `PasswordSession`. */
export function sessionAccountToSessionData(
  account: SessionAccount,
): SessionData {
  return {
    accessJwt: account.accessJwt ?? '',
    active: account.active ?? true,
    did: account.did,
    email: account.email,
    emailAuthFactor: account.emailAuthFactor,
    emailConfirmed: account.emailConfirmed,
    handle: account.handle as SessionData['handle'],
    refreshJwt: account.refreshJwt ?? '',
    status: account.status,
    service: account.service,
  }
}

export function isSessionExpired(account: SessionAccount) {
  return account.accessJwt ? isJwtExpired(account.accessJwt) : true
}
