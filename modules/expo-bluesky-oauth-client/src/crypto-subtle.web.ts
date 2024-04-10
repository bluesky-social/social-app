import {WebcryptoKey} from '@atproto/jwk-webcrypto'
import {CryptoImplementation, DigestAlgorithm, Key} from '@atproto/oauth-client'

// @ts-ignore web only, this silences some warnings
const crypto = global.crypto

export class CryptoSubtle implements CryptoImplementation {
  constructor(_: any) {
    if (!crypto?.subtle) {
      throw new Error(
        'Crypto with CryptoSubtle is required. If running in a browser, make sure the current page is loaded over HTTPS.',
      )
    }
  }

  async createKey(algs: string[]): Promise<Key> {
    return WebcryptoKey.generate(undefined, algs)
  }

  getRandomValues(byteLength: number): Uint8Array {
    const bytes = new Uint8Array(byteLength)
    crypto.getRandomValues(bytes)
    return bytes
  }

  async digest(
    bytes: Uint8Array,
    algorithm: DigestAlgorithm,
  ): Promise<Uint8Array> {
    const buffer = await crypto.subtle.digest(
      digestAlgorithmToSubtle(algorithm),
      bytes,
    )
    return new Uint8Array(buffer)
  }
}

// @ts-ignore web only type
function digestAlgorithmToSubtle({name}: DigestAlgorithm): AlgorithmIdentifier {
  switch (name) {
    case 'sha256':
    case 'sha384':
    case 'sha512':
      return `SHA-${name.slice(-3)}`
    default:
      throw new Error(`Unknown hash algorithm ${name}`)
  }
}
