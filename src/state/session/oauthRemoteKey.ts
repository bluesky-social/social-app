/**
 * Eurosky fork: confidential-client signing key.
 *
 * The confidential client authenticates at the token endpoint with a
 * `private_key_jwt` client assertion. The private key must NOT live in the
 * browser, so this `Key` holds only the PUBLIC JWK and delegates the actual
 * signature to the stateless assertion Worker (`OAUTH_ASSERTION_URL`), which
 * holds the private key as a secret.
 *
 * Why this works (verified against @atproto/oauth-client):
 * `createClientCredentialsFactory` builds the full client-assertion claim set
 * itself (`iss`/`sub`/`aud`/`jti`/`iat`/`exp`) and calls `await
 * key.createJwt({ alg }, payload)`. `Key.createJwt` is async, so delegating
 * the signature over the network is the intended extension point.
 *
 * `isPrivate` is overridden to `true`: `keyset.findPrivateKey({usage:'sign'})`
 * ultimately rejects keys whose `isPrivate` is false (`'sign'` is not a
 * public-key usage), and we only hold the public JWK. We never expose private
 * material; the override only makes the keyset select this key for signing.
 *
 * `verifyJwt` is inherited from `JoseKey` (verifies with the public JWK). It
 * is not exercised by the client-assertion path but is kept correct.
 */
import {
  type Jwk,
  type JwtHeader,
  type JwtPayload,
  type SignedJwt,
} from '@atproto/jwk'
import {JoseKey} from '@atproto/jwk-jose'

import {OAUTH_ASSERTION_URL} from '#/config/oauth'

export class OAuthRemoteKey extends JoseKey {
  // The keyset only treats a key as signing-capable if `isPrivate`. We hold
  // the public JWK; the real private key is remote (the Worker).
  override get isPrivate(): boolean {
    return true
  }

  override async createJwt(
    header: JwtHeader,
    payload: JwtPayload,
  ): Promise<SignedJwt> {
    const fullHeader: JwtHeader = {
      ...header,
      alg: header.alg || this.alg || 'ES256',
      kid: this.kid,
      typ: 'JWT',
    }

    let res: Response
    try {
      res = await fetch(OAUTH_ASSERTION_URL, {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({header: fullHeader, payload}),
      })
    } catch (cause) {
      throw new Error('oauth: assertion Worker unreachable', {cause})
    }
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      throw new Error(
        `oauth: assertion Worker rejected request (${res.status})${
          detail ? `: ${detail.slice(0, 200)}` : ''
        }`,
      )
    }
    const data = (await res.json()) as {jws?: unknown}
    if (typeof data.jws !== 'string' || !data.jws) {
      throw new Error('oauth: assertion Worker returned no jws')
    }
    return data.jws as SignedJwt
  }
}

/**
 * Build the keyset key from the inlined public JWKS (first key).
 *
 * Normalization is load-bearing: @atproto/jwk's key matcher rejects a key
 * carrying the legacy `use: 'sig'` for a `sign` usage (it wants `key_ops`;
 * its own JoseKey factory logs a deprecation and does this same swap). The
 * published JWKS deliberately keeps standard `use: 'sig'` (correct for the
 * authorization server verifying our assertion) - we only reshape the
 * in-app signing key here. `key_ops: ['sign']` + the `isPrivate` override
 * are what make `keyset.list({usage:'sign'})` select this key.
 */
export function createOAuthRemoteKey(
  publicJwk: Record<string, unknown>,
): OAuthRemoteKey {
  const {use: _use, key_ops: _keyOps, ...rest} = publicJwk
  return new OAuthRemoteKey({...rest, key_ops: ['sign']} as Jwk)
}
