import {
  exportJWK,
  importJWK,
  importPKCS8,
  JWK,
  jwtVerify,
  JWTVerifyOptions,
  KeyLike,
  SignJWT,
} from 'jose'

import {
  Jwk,
  jwkSchema,
  Jwt,
  JwtHeader,
  JwtPayload,
  Key,
  VerifyOptions,
  VerifyPayload,
  VerifyResult,
} from '#/oauth-client-temp/jwk'
import {either} from './util'

export type Importable = string | KeyLike | Jwk

export class JoseKey extends Key {
  #keyObj?: KeyLike | Uint8Array

  protected async getKey() {
    return (this.#keyObj ||= await importJWK(this.jwk as JWK))
  }

  async createJwt(header: JwtHeader, payload: JwtPayload) {
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

    const keyObj = await this.getKey()
    return new SignJWT(payload)
      .setProtectedHeader({...header, kid: this.kid})
      .sign(keyObj) as Promise<Jwt>
  }

  async verifyJwt<
    P extends VerifyPayload = JwtPayload,
    C extends string = string,
  >(token: Jwt, options?: VerifyOptions<C>): Promise<VerifyResult<P, C>> {
    const keyObj = await this.getKey()
    const result = await jwtVerify(token, keyObj, {
      ...options,
      algorithms: this.algorithms,
    } as JWTVerifyOptions)
    return result as VerifyResult<P, C>
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
