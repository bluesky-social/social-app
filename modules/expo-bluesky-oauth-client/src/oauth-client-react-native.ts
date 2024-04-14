import {requireNativeModule} from 'expo-modules-core'
import {Jwk, Jwt} from '@atproto/jwk'

const NativeModule = requireNativeModule('ExpoBlueskyOAuthClient')

const LINKING_ERROR =
  'The package ExpoBlueskyOAuthClient is not linked. Make sure you have run `expo install expo-bluesky-oauth-client` and rebuilt your app.'

export const OauthClientReactNative = (NativeModule as null) || {
  getRandomValues(_length: number): Uint8Array {
    throw new Error(LINKING_ERROR)
  },

  /**
   * @throws if the algorithm is not supported ("sha256" must be supported)
   */
  digest(_bytes: Uint8Array, _algorithm: string): Uint8Array {
    throw new Error(LINKING_ERROR)
  },

  /**
   * Create a private JWK for the given algorithm. The JWK should have a "use"
   * an does not need a "kid" property.
   *
   * @throws if the algorithm is not supported ("ES256" must be supported)
   */
  generateJwk(_algo: string): Jwk {
    throw new Error(LINKING_ERROR)
  },

  createJwt(_header: unknown, _payload: unknown, _jwk: unknown): Jwt {
    throw new Error(LINKING_ERROR)
  },

  verifyJwt(
    _token: Jwt,
    _jwk: Jwk,
  ): {
    payload: Record<string, unknown>
    protectedHeader: Record<string, unknown>
  } {
    throw new Error(LINKING_ERROR)
  },
}
