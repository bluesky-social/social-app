import {OAuthClientMetadata} from '@atproto/oauth-client-metadata'

import {Keyset} from '#/oauth-client-temp/jwk'

export function validateClientMetadata(
  metadata: OAuthClientMetadata,
  keyset?: Keyset,
): asserts metadata is OAuthClientMetadata & {client_id: string} {
  if (!metadata.client_id) {
    throw new TypeError('client_id must be provided')
  }

  const url = new URL(metadata.client_id)
  if (url.pathname !== '/') {
    throw new TypeError('origin must be a URL root')
  }
  if (url.username || url.password) {
    throw new TypeError('client_id URI must not contain a username or password')
  }
  if (url.search || url.hash) {
    throw new TypeError('client_id URI must not contain a query or fragment')
  }
  if (url.href !== metadata.client_id) {
    throw new TypeError('client_id URI must be a normalized URL')
  }

  if (
    url.hostname === 'localhost' ||
    url.hostname === '[::1]' ||
    url.hostname === '127.0.0.1'
  ) {
    if (url.protocol !== 'http:' || url.port) {
      throw new TypeError('loopback clients must use "http:" and port "80"')
    }
  }

  if (metadata.client_uri && metadata.client_uri !== metadata.client_id) {
    throw new TypeError('client_uri must match client_id')
  }

  if (!metadata.redirect_uris.length) {
    throw new TypeError('At least one redirect_uri must be provided')
  }
  for (const u of metadata.redirect_uris) {
    const redirectUrl = new URL(u)
    // Loopback redirect_uris require special handling
    if (
      redirectUrl.hostname === 'localhost' ||
      redirectUrl.hostname === '[::1]' ||
      redirectUrl.hostname === '127.0.0.1'
    ) {
      if (redirectUrl.protocol !== 'http:') {
        throw new TypeError('loopback redirect_uris must use "http:"')
      }
    } else {
      // Not a loopback client
      if (redirectUrl.origin !== url.origin) {
        throw new TypeError('redirect_uris must have the same origin')
      }
    }
  }

  for (const endpoint of [
    'token',
    'revocation',
    'introspection',
    'pushed_authorization_request',
  ] as const) {
    const method = metadata[`${endpoint}_endpoint_auth_method`]
    if (method && method !== 'none') {
      if (!keyset) {
        throw new TypeError(`Keyset is required for ${method} method`)
      }
      if (!metadata[`${endpoint}_endpoint_auth_signing_alg`]) {
        throw new TypeError(
          `${endpoint}_endpoint_auth_signing_alg must be provided`,
        )
      }
    }
  }
}
