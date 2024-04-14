import {Jwk, jwkSchema} from '@atproto/jwk'
import {JoseKey} from '@atproto/jwk-jose'

import {CryptoKey} from './native-types'
import {generateKeyPair, isSignatureKeyPair} from './util.web'

// @ts-ignore web only, stops warnings for crypto being missing
const crypto = global.crypto

// Global has this, but this stops the warnings
interface CryptoKeyPair {
  privateKey: CryptoKey
  publicKey: CryptoKey
}

export class RNCryptoKey extends JoseKey {
  static async generate(
    kid: string = crypto.randomUUID(),
    allowedAlgos: string[] = ['ES256'],
    exportable = false,
  ) {
    const cryptoKeyPair: CryptoKeyPair = await generateKeyPair(
      allowedAlgos,
      exportable,
    )
    return this.fromKeypair(kid, cryptoKeyPair)
  }

  static async fromKeypair(
    kid: string,
    cryptoKeyPair: CryptoKeyPair,
  ): Promise<RNCryptoKey> {
    if (!isSignatureKeyPair(cryptoKeyPair)) {
      throw new TypeError('CryptoKeyPair must be compatible with sign/verify')
    }

    // https://datatracker.ietf.org/doc/html/rfc7517
    // > The "use" and "key_ops" JWK members SHOULD NOT be used together; [...]
    // > Applications should specify which of these members they use.

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {key_ops: _, ...jwk} = await crypto.subtle.exportKey(
      'jwk',
      cryptoKeyPair.privateKey.extractable
        ? cryptoKeyPair.privateKey
        : cryptoKeyPair.publicKey,
    )

    const use = jwk.use ?? 'sig'
    const alg = jwk.alg ?? 'ES256'

    if (use !== 'sig') {
      throw new TypeError('Unsupported JWK use')
    }

    return new RNCryptoKey(
      jwkSchema.parse({...jwk, use, kid, alg}),
      cryptoKeyPair,
    )
  }

  constructor(jwk: Jwk, readonly cryptoKeyPair: CryptoKeyPair) {
    super(jwk)
  }

  get isPrivate() {
    return true
  }

  get privateJwk(): Jwk | undefined {
    if (super.isPrivate) return this.jwk
    throw new Error('Private key is not exportable.')
  }

  protected async getKey() {
    return this.cryptoKeyPair.privateKey
  }
}
