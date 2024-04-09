import {jwkAlgorithms} from './alg'
import {Jwk, jwkSchema} from './jwk'
import {Jwt, JwtHeader, JwtPayload} from './jwt'
import {VerifyOptions, VerifyPayload, VerifyResult} from './jwt-verify'
import {cachedGetter} from './util'

export abstract class Key {
  constructor(protected jwk: Jwk) {
    // A key should always be used either for signing or encryption.
    if (!jwk.use) throw new TypeError('Missing "use" Parameter value')
  }

  get isPrivate(): boolean {
    const {jwk} = this
    if ('d' in jwk && jwk.d !== undefined) return true
    return this.isSymetric
  }

  get isSymetric(): boolean {
    const {jwk} = this
    if ('k' in jwk && jwk.k !== undefined) return true
    return false
  }

  get privateJwk(): Jwk | undefined {
    return this.isPrivate ? this.jwk : undefined
  }

  @cachedGetter
  get publicJwk(): Jwk | undefined {
    if (this.isSymetric) return undefined
    if (this.isPrivate) {
      const {d: _, ...jwk} = this.jwk as any
      return jwk
    }
    return this.jwk
  }

  @cachedGetter
  get bareJwk(): Jwk | undefined {
    if (this.isSymetric) return undefined
    const {kty, crv, e, n, x, y} = this.jwk as any
    return jwkSchema.parse({crv, e, kty, n, x, y})
  }

  get use() {
    return this.jwk.use!
  }

  /**
   * The (forced) algorithm to use. If not provided, the key will be usable with
   * any of the algorithms in {@link algorithms}.
   */
  get alg() {
    return this.jwk.alg
  }

  get kid() {
    return this.jwk.kid
  }

  get crv() {
    return (this.jwk as undefined | Extract<Jwk, {crv: unknown}>)?.crv
  }

  get canVerify() {
    return this.use === 'sig'
  }

  get canSign() {
    return this.use === 'sig' && this.isPrivate && !this.isSymetric
  }

  /**
   * All the algorithms that this key can be used with. If `alg` is provided,
   * this set will only contain that algorithm.
   */
  @cachedGetter
  get algorithms(): readonly string[] {
    return Array.from(jwkAlgorithms(this.jwk))
  }

  /**
   * Create a signed JWT
   */
  abstract createJwt(header: JwtHeader, payload: JwtPayload): Promise<Jwt>

  /**
   * Verify the signature, headers and payload of a JWT
   */
  abstract verifyJwt<
    P extends VerifyPayload = JwtPayload,
    C extends string = string,
  >(token: Jwt, options?: VerifyOptions<C>): Promise<VerifyResult<P, C>>
}
