import {GenericStore} from '@atproto/caching'
import {
  Fetch,
  fetchFailureHandler,
  fetchJsonProcessor,
  fetchOkProcessor,
} from '@atproto/fetch'
import {OAuthClientMetadata} from '@atproto/oauth-client-metadata'
import {OAuthServerMetadata} from '@atproto/oauth-server-metadata'

import {dpopFetchWrapper} from '#/oauth-client-temp/fetch-dpop'
import {Jwt, Key, Keyset} from '#/oauth-client-temp/jwk'
import {FALLBACK_ALG} from './constants'
import {CryptoWrapper} from './crypto-wrapper'
import {OAuthResolver} from './oauth-resolver'
import {
  OAuthEndpointName,
  OAuthTokenResponse,
  OAuthTokenType,
} from './oauth-types'

export type TokenSet = {
  iss: string
  sub: string
  aud: string
  scope?: string

  id_token?: Jwt
  refresh_token?: string
  access_token: string
  token_type: OAuthTokenType
  expires_at?: number
}

export class OAuthServer {
  readonly dpopFetch: (request: Request) => Promise<Response>

  constructor(
    readonly dpopKey: Key,
    readonly serverMetadata: OAuthServerMetadata,
    readonly clientMetadata: OAuthClientMetadata & {client_id: string},
    readonly dpopNonceCache: GenericStore<string, string>,
    readonly resolver: OAuthResolver,
    readonly crypto: CryptoWrapper,
    readonly keyset?: Keyset,
    fetch?: Fetch,
  ) {
    const dpopFetch = dpopFetchWrapper({
      fetch,
      iss: this.clientMetadata.client_id,
      key: dpopKey,
      alg: negotiateAlg(
        dpopKey,
        serverMetadata.dpop_signing_alg_values_supported,
      ),
      sha256: async v => crypto.sha256(v),
      nonceCache: dpopNonceCache,
    })

    this.dpopFetch = request => dpopFetch(request).catch(fetchFailureHandler)
  }

  async revoke(token: string) {
    try {
      await this.request('revocation', {token})
    } catch {
      // Don't care
    }
  }

  async exchangeCode(code: string, verifier?: string): Promise<TokenSet> {
    const {json: tokenResponse} = await this.request('token', {
      grant_type: 'authorization_code',
      redirect_uri: this.clientMetadata.redirect_uris[0]!,
      code,
      code_verifier: verifier,
    })

    try {
      if (!tokenResponse.sub) {
        throw new TypeError(`Missing "sub" in token response`)
      }

      // VERY IMPORTANT !
      const resolved = await this.checkSubIssuer(tokenResponse.sub)

      return {
        sub: tokenResponse.sub,
        aud: resolved.url.href,
        iss: resolved.metadata.issuer,

        scope: tokenResponse.scope,
        id_token: tokenResponse.id_token,
        refresh_token: tokenResponse.refresh_token,
        access_token: tokenResponse.access_token,
        token_type: tokenResponse.token_type ?? 'Bearer',
        expires_at:
          typeof tokenResponse.expires_in === 'number'
            ? Date.now() + tokenResponse.expires_in * 1000
            : undefined,
      }
    } catch (err) {
      await this.revoke(tokenResponse.access_token)

      throw err
    }
  }

  async refresh(tokenSet: TokenSet): Promise<TokenSet> {
    if (!tokenSet.refresh_token) {
      throw new Error('No refresh token available')
    }

    const {json: tokenResponse} = await this.request('token', {
      grant_type: 'refresh_token',
      refresh_token: tokenSet.refresh_token,
    })

    try {
      if (tokenSet.sub !== tokenResponse.sub) {
        throw new TypeError(`Unexpected "sub" in token response`)
      }
      if (tokenSet.iss !== this.serverMetadata.issuer) {
        throw new TypeError('Issuer mismatch')
      }

      // VERY IMPORTANT !
      const resolved = await this.checkSubIssuer(tokenResponse.sub)

      return {
        sub: tokenResponse.sub,
        aud: resolved.url.href,
        iss: resolved.metadata.issuer,

        id_token: tokenResponse.id_token,
        refresh_token: tokenResponse.refresh_token,
        access_token: tokenResponse.access_token,
        token_type: tokenResponse.token_type ?? 'Bearer',
        expires_at: Date.now() + (tokenResponse.expires_in ?? 60) * 1000,
      }
    } catch (err) {
      await this.revoke(tokenResponse.access_token)

      throw err
    }
  }

  /**
   * Whenever an OAuth token response is received, we **MUST** verify that the
   * "sub" is a DID, whose issuer authority is indeed the server we just
   * obtained credentials from. This check is a critical step to actually be
   * able to use the "sub" (DID) as being the actual user's identifier.
   */
  protected async checkSubIssuer(sub: string) {
    const resolved = await this.resolver.resolve(sub)
    if (resolved.metadata.issuer !== this.serverMetadata.issuer) {
      // Maybe the user switched PDS.
      throw new TypeError('Issuer mismatch')
    }
    return resolved
  }

  async request<E extends OAuthEndpointName>(
    endpoint: E,
    payload: Record<string, unknown>,
  ) {
    const url = this.serverMetadata[`${endpoint}_endpoint`]
    if (!url) throw new Error(`No ${endpoint} endpoint available`)
    const auth = await this.buildClientAuth(endpoint)

    const request = new Request(url, {
      method: 'POST',
      headers: {...auth.headers, 'Content-Type': 'application/json'},
      body: JSON.stringify({...payload, ...auth.payload}),
    })

    const response = await this.dpopFetch(request)
      .then(fetchOkProcessor())
      .then(
        fetchJsonProcessor<
          E extends 'pushed_authorization_request'
            ? {request_uri: string}
            : E extends 'token'
            ? OAuthTokenResponse
            : unknown
        >(),
      )

    // TODO: validate using zod ?
    if (endpoint === 'token') {
      if (!response.json.access_token) {
        throw new TypeError('No access token in token response')
      }
    }

    return response
  }

  async buildClientAuth(endpoint: OAuthEndpointName): Promise<{
    headers?: Record<string, string>
    payload:
      | {
          client_id: string
        }
      | {
          client_id: string
          client_assertion_type: string
          client_assertion: string
        }
  }> {
    const methodSupported =
      this.serverMetadata[`${endpoint}_endpoint_auth_methods_supported`] ||
      this.serverMetadata.token_endpoint_auth_methods_supported

    const method =
      this.clientMetadata[`${endpoint}_endpoint_auth_method`] ||
      this.clientMetadata.token_endpoint_auth_method

    if (
      method === 'private_key_jwt' ||
      (this.keyset &&
        !method &&
        (methodSupported?.includes('private_key_jwt') ?? false))
    ) {
      if (!this.keyset) throw new Error('No keyset available')

      try {
        const alg =
          this.serverMetadata[
            `${endpoint}_endpoint_auth_signing_alg_values_supported`
          ] ??
          this.serverMetadata
            .token_endpoint_auth_signing_alg_values_supported ??
          FALLBACK_ALG

        // If jwks is defined, make sure to only sign using a key that exists in
        // the jwks. If jwks_uri is defined, we can't be sure that the key we're
        // looking for is in there so we will just assume it is.
        const kid = this.clientMetadata.jwks?.keys
          .map(({kid}) => kid)
          .filter((v): v is string => !!v)

        return {
          payload: {
            client_id: this.clientMetadata.client_id,
            client_assertion_type:
              'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
            client_assertion: await this.keyset.sign(
              {alg, kid},
              {
                iss: this.clientMetadata.client_id,
                sub: this.clientMetadata.client_id,
                aud: this.serverMetadata.issuer,
                jti: await this.crypto.generateNonce(),
                iat: Math.floor(Date.now() / 1000),
              },
            ),
          },
        }
      } catch (err) {
        if (method === 'private_key_jwt') throw err

        // Else try next method
      }
    }

    if (
      method === 'none' ||
      (!method && (methodSupported?.includes('none') ?? true))
    ) {
      return {
        payload: {
          client_id: this.clientMetadata.client_id,
        },
      }
    }

    throw new Error(`Unsupported ${endpoint} authentication method`)
  }
}

function negotiateAlg(key: Key, supportedAlgs: string[] | undefined): string {
  const alg = key.algorithms.find(a => supportedAlgs?.includes(a) ?? true)
  if (alg) return alg

  throw new Error('Key does not match any alg supported by the server')
}
