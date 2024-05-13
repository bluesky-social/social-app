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
  async digest(_bytes: Uint8Array, _algorithm: string): Promise<Uint8Array> {
    throw new Error(LINKING_ERROR)
  },

  /**
   * Create a private JWK for the given algorithm. The JWK should have a "use"
   * an does not need a "kid" property.
   *
   * @throws if the algorithm is not supported ("ES256" must be supported)
   */
  async generateJwk(
    _algo: string,
  ): Promise<{publicKey: string; privateKey: string}> {
    throw new Error(LINKING_ERROR)
  },

  async createJwt(
    _header: unknown,
    _payload: unknown,
    _jwk: unknown,
  ): Promise<Jwt> {
    throw new Error(LINKING_ERROR)
  },

  async verifyJwt(
    _token: Jwt,
    _jwk: Jwk,
  ): Promise<{
    payload: string
    protectedHeader: string
  }> {
    throw new Error(LINKING_ERROR)
  },
}
