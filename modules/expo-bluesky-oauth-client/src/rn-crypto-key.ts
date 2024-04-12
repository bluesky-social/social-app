import {requireNativeModule} from 'expo-modules-core'
import {Jwk, jwkSchema} from '@atproto/jwk'

import {JoseKey} from './jose-key'
import {CryptoKey, NativeJWKKey} from './native-types'

const NativeModule = requireNativeModule('ExpoBlueskyOAuthClient')

interface CryptoKeyPair {
  privateKey: CryptoKey
  publicKey: CryptoKey
}

interface NativeJWKKeyPair {
  privateKey: NativeJWKKey
  publicKey: NativeJWKKey
}

export class RnCryptoKey extends JoseKey {
  static async generate(
    kid: string | undefined,
    _: string[] = ['ES256'],
    __ = false,
  ) {
    const {privateKey, publicKey} = await NativeModule.generateKeyPair(kid)

    const nativeKeyPair = {
      privateKey: JSON.parse(privateKey),
      publicKey: JSON.parse(publicKey),
    }

    return this.fromKeypair(nativeKeyPair.privateKey.kid, nativeKeyPair)
  }

  static fromKeypair(kid: string, cryptoKeyPair: NativeJWKKeyPair) {
    const use = cryptoKeyPair.privateKey.use ?? 'sig'
    const alg = cryptoKeyPair.privateKey.alg ?? 'ES256'

    if (use !== 'sig') {
      throw new TypeError('Unsupported JWK use')
    }

    const webCryptoKeyPair: CryptoKeyPair = {
      privateKey: {
        algorithm: {
          name: 'ECDSA',
          namedCurve: 'P-256',
        },
        extractable: true,
        type: 'private',
        usages: ['sign'],
      },
      publicKey: {
        algorithm: {
          name: 'ECDSA',
          namedCurve: 'P-256',
        },
        extractable: true,
        type: 'public',
        usages: ['verify'],
      },
    }

    return new RnCryptoKey(
      jwkSchema.parse({...cryptoKeyPair.privateKey, use, kid, alg}),
      webCryptoKeyPair,
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
