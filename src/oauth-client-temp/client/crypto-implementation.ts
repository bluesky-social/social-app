import {CryptoKey} from '#/oauth-client-temp/client/key'
import {Key} from '#/oauth-client-temp/jwk'

// TODO this might not be necessary with this setup, we will see

export type DigestAlgorithm = {
  name: 'sha256' | 'sha384' | 'sha512'
}

export class CryptoImplementation {
  public async createKey(algs: string[]): Promise<Key> {
    return CryptoKey.generate(undefined, algs)
  }

  getRandomValues(byteLength: number): Uint8Array {
    const bytes = new Uint8Array(byteLength)
    // TODO REVIEW POLYFILL
    // @ts-ignore Polyfilled
    return crypto.getRandomValues(bytes)
  }

  async digest(
    bytes: Uint8Array,
    algorithm: DigestAlgorithm,
  ): Promise<Uint8Array> {
    // TODO REVIEW POLYFILL
    // @ts-ignore Polyfilled
    const buffer = await this.crypto.subtle.digest(
      digestAlgorithmToSubtle(algorithm),
      bytes,
    )
    return new Uint8Array(buffer)
  }
}

// TODO OAUTH types
// @ts-ignore
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
