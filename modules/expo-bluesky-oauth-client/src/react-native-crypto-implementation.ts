import {CryptoImplementation, DigestAlgorithm, Key} from '@atproto/oauth-client'

import {OauthClientReactNative} from './oauth-client-react-native'
import {ReactNativeKey} from './react-native-key'

export class ReactNativeCryptoImplementation implements CryptoImplementation {
  async createKey(algs: string[]): Promise<Key> {
    const bytes = await this.getRandomValues(12)
    const kid = Array.from(bytes, byteToHex).join('')
    return await ReactNativeKey.generate(kid, algs)
  }

  async getRandomValues(length: number): Promise<Uint8Array> {
    return OauthClientReactNative.getRandomValues(length)
  }

  async digest(
    bytes: Uint8Array,
    algorithm: DigestAlgorithm,
  ): Promise<Uint8Array> {
    return OauthClientReactNative.digest(bytes, algorithm.name)
  }
}

function byteToHex(b: number): string {
  return b.toString(16).padStart(2, '0')
}
