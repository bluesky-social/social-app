import {requireNativeModule} from 'expo-modules-core'
import {jwkSchema} from '@atproto/jwk'
import {Key} from '@atproto/jwk'
import {
  exportJWK,
  importJWK,
  importPKCS8,
  JWK,
  KeyLike,
  VerifyOptions,
} from 'jose'
import {JwtHeader, JwtPayload} from 'jwt-decode'

const NativeModule = requireNativeModule('ExpoBlueskyOAuthClient')

export class JoseKey extends Key {
  #keyObj?: KeyLike | Uint8Array

  protected async getKey() {
    return (this.#keyObj ||= await importJWK(this.jwk as JWK))
  }

  async createJwt(header: JwtHeader, payload: JwtPayload): Promise<string> {
    if (header.kid && header.kid !== this.kid) {
      throw new TypeError(
        `Invalid "kid" (${header.kid}) used to sign with key "${this.kid}"`,
      )
    }

    if (!header.alg || !this.algorithms.includes(header.alg)) {
      throw new TypeError(
        `Invalid "alg" (${header.alg}) used to sign with key "${this.kid}"`,
      )
    }

    return await NativeModule.createJwt(
      JSON.stringify(this.privateJwk),
      JSON.stringify(header),
      JSON.stringify(payload),
    )
  }

  async verifyJwt<
    P extends VerifyPayload = JwtPayload,
    C extends string = string,
  >(token: Jwt, options?: VerifyOptions<C>): Promise<VerifyResult<P, C>> {
    const result = await NativeModule.verifyJwt(
      JSON.stringify(this.publicJwk),
      token,
      JSON.stringify(options),
    )
    return result
    // return result as VerifyResult<P, C>
  }

  static async fromImportable(
    input: Importable,
    kid?: string,
  ): Promise<JoseKey> {
    if (typeof input === 'string') {
      // PKCS8
      if (input.startsWith('-----')) {
        return this.fromPKCS8(input, kid)
      }

      // Jwk (string)
      if (input.startsWith('{')) {
        return this.fromJWK(input, kid)
      }

      throw new TypeError('Invalid input')
    }

    if (typeof input === 'object') {
      // Jwk
      if ('kty' in input || 'alg' in input) {
        return this.fromJWK(input, kid)
      }

      // KeyLike
      return this.fromJWK(await exportJWK(input), kid)
    }

    throw new TypeError('Invalid input')
  }

  static async fromPKCS8(pem: string, kid?: string): Promise<JoseKey> {
    const keyLike = await importPKCS8(pem, '', {extractable: true})
    return this.fromJWK(await exportJWK(keyLike), kid)
  }

  static async fromJWK(
    input: string | Record<string, unknown>,
    inputKid?: string,
  ): Promise<JoseKey> {
    const jwk = jwkSchema.parse(
      typeof input === 'string' ? JSON.parse(input) : input,
    )

    const kid = either(jwk.kid, inputKid)
    const alg = jwk.alg
    const use = jwk.use || 'sig'

    return new JoseKey({...jwk, kid, alg, use})
  }
}
