import {GenericStore} from '@atproto/caching'
import {Fetch} from '@atproto/fetch'

import {b64uEncode} from '#/oauth-client-temp/b64'
import {Key} from '#/oauth-client-temp/jwk'

export function dpopFetchWrapper({
  key,
  iss,
  alg,
  // TODO REVIEW POLYFILL
  // @ts-ignore Polyfilled
  sha256 = typeof crypto !== 'undefined' && crypto.subtle != null
    ? subtleSha256
    : undefined,
  nonceCache,
}: {
  key: Key
  iss: string
  alg?: string
  sha256?: (input: string) => Promise<string>
  nonceCache?: GenericStore<string, string>
  fetch?: Fetch
}): Fetch {
  if (!sha256) {
    throw new Error(
      `crypto.subtle is not available in this environment. Please provide a sha256 function.`,
    )
  }

  return async function (request) {
    return dpopFetch.call(
      this,
      request,
      key,
      iss,
      alg,
      sha256,
      nonceCache,
      fetch,
    )
  }
}

export async function dpopFetch(
  this: ThisParameterType<Fetch>,
  request: Request,
  key: Key,
  iss: string,
  alg: string = key.alg || 'ES256',
  sha256: (input: string) => string | PromiseLike<string> = subtleSha256,
  nonceCache?: GenericStore<string, string>,
  fetch = globalThis.fetch as Fetch,
): Promise<Response> {
  const authorizationHeader = request.headers.get('Authorization')
  const ath = authorizationHeader?.startsWith('DPoP ')
    ? await sha256(authorizationHeader.slice(5))
    : undefined

  const {origin} = new URL(request.url)

  // Clone request for potential retry
  const clonedRequest = request.clone()

  // Try with the previously known nonce
  const oldNonce = await Promise.resolve()
    .then(() => nonceCache?.get(origin))
    .catch(() => undefined) // Ignore cache.get errors

  request.headers.set(
    'DPoP',
    await buildProof(key, alg, iss, request.method, request.url, oldNonce, ath),
  )

  const response = await fetch(request)

  const nonce = response.headers.get('DPoP-Nonce')
  if (!nonce) return response

  // Store the fresh nonce for future requests
  try {
    await nonceCache?.set(origin, nonce)
  } catch {
    // Ignore cache.set errors
  }

  if (!(await isUseDpopNonceError(response))) {
    return response
  }

  clonedRequest.headers.set(
    'DPoP',
    await buildProof(key, alg, iss, request.method, request.url, nonce, ath),
  )

  return fetch(clonedRequest)
}

async function buildProof(
  key: Key,
  alg: string,
  iss: string,
  htm: string,
  htu: string,
  nonce?: string,
  ath?: string,
) {
  if (!key.bareJwk) {
    throw new Error('Only asymetric keys can be used as DPoP proofs')
  }

  const now = Math.floor(Date.now() / 1e3)

  return key.createJwt(
    {
      alg,
      typ: 'dpop+jwt',
      jwk: key.bareJwk,
    },
    {
      iss,
      iat: now,
      exp: now + 10,
      // Any collision will cause the request to be rejected by the server. no biggie.
      jti: Math.random().toString(36).slice(2),
      htm,
      htu,
      nonce,
      ath,
    },
  )
}

async function isUseDpopNonceError(response: Response): Promise<boolean> {
  if (response.status !== 400) {
    return false
  }

  const ct = response.headers.get('Content-Type')
  const mime = ct?.split(';')[0]?.trim()
  if (mime !== 'application/json') {
    return false
  }

  try {
    const body = await response.clone().json()
    return body?.error === 'use_dpop_nonce'
  } catch {
    return false
  }
}

function subtleSha256(input: string): Promise<string> {
  // TODO REVIEW POLYFILL
  // @ts-ignore Polyfilled
  if (typeof crypto === 'undefined' || crypto.subtle == null) {
    throw new Error(
      `crypto.subtle is not available in this environment. Please provide a sha256 function.`,
    )
  }

  // TODO REVIEW POLYFILL
  // @ts-ignore Polyfilled
  return (
    // TODO REVIEW POLYFILL
    // @ts-ignore Polyfilled
    crypto.subtle
      // TODO REVIEW POLYFILL
      // @ts-ignore Polyfilled
      .digest('SHA-256', new TextEncoder().encode(input))
      // TODO OAUTH types
      .then((digest: Iterable<number>) => b64uEncode(new Uint8Array(digest)))
  )
}
