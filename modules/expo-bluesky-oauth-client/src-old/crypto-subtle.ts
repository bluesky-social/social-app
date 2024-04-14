import {requireNativeModule} from 'expo-modules-core'
import {CryptoImplementation, Key} from '@atproto/oauth-client'

import {RnCryptoKey} from './rn-crypto-key'

// It loads the native module object from the JSI or falls back to
// the bridge module (from NativeModulesProxy) if the remote debugger is on.
const NativeModule = requireNativeModule('ExpoBlueskyOAuthClient')

export class CryptoSubtle implements CryptoImplementation {
  // We won't use the `algos` parameter here, as we will always use `ES256`.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async createKey(algos: string[] = ['ES256']): Promise<Key> {
    return await RnCryptoKey.generate(undefined, ['ES256'])
  }

  getRandomValues(byteLength: number): Uint8Array {
    return NativeModule.getRandomValues(byteLength)
  }

  async digest(bytes: Uint8Array): Promise<Uint8Array> {
    return await NativeModule.digest(bytes)
  }
}
