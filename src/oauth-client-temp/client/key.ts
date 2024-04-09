import {
  fromSubtleAlgorithm,
  generateKeypair,
  isSignatureKeyPair,
} from '#/oauth-client-temp/client/util'
import {Jwk, jwkSchema} from '#/oauth-client-temp/jwk'
import {JoseKey} from '#/oauth-client-temp/jwk-jose'

export class CryptoKey extends JoseKey {
  // static async fromIndexedDB(kid: string, allowedAlgos: string[] = ['ES384']) {
  //   const cryptoKeyPair = await loadCryptoKeyPair(kid, allowedAlgos)
  //   return this.fromKeypair(kid, cryptoKeyPair)
  // }

  static async generate(
    // TODO REVIEW POLYFILL
    // @ts-ignore Polyfilled
    kid: string = crypto.randomUUID(),
    allowedAlgos: string[] = ['ES384'],
    exportable = false,
  ) {
    const cryptoKeyPair = await generateKeypair(allowedAlgos, exportable)
    return this.fromKeypair(kid, cryptoKeyPair)
  }

  // TODO REVIEW POLYFILL
  // @ts-ignore Polyfilled
  static async fromKeypair(kid: string, cryptoKeyPair: CryptoKeyPair) {
    if (!isSignatureKeyPair(cryptoKeyPair)) {
      throw new TypeError('CryptoKeyPair must be compatible with sign/verify')
    }

    // https://datatracker.ietf.org/doc/html/rfc7517
    // > The "use" and "key_ops" JWK members SHOULD NOT be used together; [...]
    // > Applications should specify which of these members they use.

    // TODO REVIEW POLYFILL
    // @ts-ignore Polyfilled
    const {key_ops: _, ...jwk} = await crypto.subtle.exportKey(
      'jwk',
      cryptoKeyPair.privateKey.extractable
        ? cryptoKeyPair.privateKey
        : cryptoKeyPair.publicKey,
    )

    const use = jwk.use ?? 'sig'
    const alg =
      jwk.alg ?? fromSubtleAlgorithm(cryptoKeyPair.privateKey.algorithm)

    if (use !== 'sig') {
      throw new TypeError('Unsupported JWK use')
    }

    return new CryptoKey(
      jwkSchema.parse({...jwk, use, kid, alg}),
      cryptoKeyPair,
    )
  }

  // TODO REVIEW POLYFILL
  // @ts-ignore Polyfilled
  constructor(jwk: Jwk, readonly cryptoKeyPair: CryptoKeyPair) {
    super(jwk)
  }

  get isPrivate() {
    return true
  }

  get privateJwk(): Jwk | undefined {
    if (super.isPrivate) return this.jwk
    throw new Error('Private Webcrypto Key not exportable')
  }

  protected async getKey() {
    return this.cryptoKeyPair.privateKey
  }
}
