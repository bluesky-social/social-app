import {Jwk} from './jwk'
import {Jwks} from './jwks'
import {Jwt, JwtHeader, JwtPayload} from './jwt'
import {unsafeDecodeJwt} from './jwt-decode'
import {VerifyOptions} from './jwt-verify'
import {Key} from './key'
import {
  cachedGetter,
  isDefined,
  matchesAny,
  Override,
  preferredOrderCmp,
} from './util'

export type JwtSignHeader = Override<JwtHeader, Pick<KeySearch, 'alg' | 'kid'>>

export type JwtPayloadGetter<P = JwtPayload> = (
  header: JwtHeader,
  key: Key,
) => P | PromiseLike<P>

export type KeySearch = {
  use?: 'sig' | 'enc'
  kid?: string | string[]
  alg?: string | string[]
}

const extractPrivateJwk = (key: Key): Jwk | undefined => key.privateJwk
const extractPublicJwk = (key: Key): Jwk | undefined => key.publicJwk

export class Keyset<K extends Key = Key> implements Iterable<K> {
  constructor(
    private readonly keys: readonly K[],
    /**
     * The preferred algorithms to use when signing a JWT using this keyset.
     */
    readonly preferredSigningAlgorithms: readonly string[] = [
      'EdDSA',
      'ES256K',
      'ES256',
      // https://datatracker.ietf.org/doc/html/rfc7518#section-3.5
      'PS256',
      'PS384',
      'PS512',
      'HS256',
      'HS384',
      'HS512',
    ],
  ) {
    if (!keys.length) throw new Error('Keyset is empty')

    const kids = new Set<string>()
    for (const {kid} of keys) {
      if (!kid) continue

      if (kids.has(kid)) throw new Error(`Duplicate key id: ${kid}`)
      else kids.add(kid)
    }
  }

  @cachedGetter
  get signAlgorithms(): readonly string[] {
    const algorithms = new Set<string>()
    for (const key of this) {
      if (key.use !== 'sig') continue
      for (const alg of key.algorithms) {
        algorithms.add(alg)
      }
    }
    return Object.freeze(
      [...algorithms].sort(preferredOrderCmp(this.preferredSigningAlgorithms)),
    )
  }

  @cachedGetter
  get publicJwks(): Jwks {
    return {
      keys: Array.from(this, extractPublicJwk).filter(isDefined),
    }
  }

  @cachedGetter
  get privateJwks(): Jwks {
    return {
      keys: Array.from(this, extractPrivateJwk).filter(isDefined),
    }
  }

  has(kid: string): boolean {
    return this.keys.some(key => key.kid === kid)
  }

  get(search: KeySearch): K {
    for (const key of this.list(search)) {
      return key
    }

    throw new TypeError(
      `Key not found ${search.kid || search.alg || '<unknown>'}`,
    )
  }

  *list(search: KeySearch): Generator<K> {
    // Optimization: Empty string or empty array will not match any key
    if (search.kid?.length === 0) return
    if (search.alg?.length === 0) return

    for (const key of this) {
      if (search.use && key.use !== search.use) continue

      if (Array.isArray(search.kid)) {
        if (!key.kid || !search.kid.includes(key.kid)) continue
      } else if (search.kid) {
        if (key.kid !== search.kid) continue
      }

      if (Array.isArray(search.alg)) {
        if (!search.alg.some(a => key.algorithms.includes(a))) continue
      } else if (typeof search.alg === 'string') {
        if (!key.algorithms.includes(search.alg)) continue
      }

      yield key
    }
  }

  findSigningKey(search: Omit<KeySearch, 'use'>): [key: Key, alg: string] {
    const {kid, alg} = search
    const matchingKeys: Key[] = []

    for (const key of this.list({kid, alg, use: 'sig'})) {
      // Not a signing key
      if (!key.canSign) continue

      // Skip negotiation if a specific "alg" was provided
      if (typeof alg === 'string') return [key, alg]

      matchingKeys.push(key)
    }

    const isAllowedAlg = matchesAny(alg)
    const candidates = matchingKeys.map(
      key => [key, key.algorithms.filter(isAllowedAlg)] as const,
    )

    // Return the first candidates that matches the preferred algorithms
    for (const prefAlg of this.preferredSigningAlgorithms) {
      for (const [matchingKey, matchingAlgs] of candidates) {
        if (matchingAlgs.includes(prefAlg)) return [matchingKey, prefAlg]
      }
    }

    // Return any candidate
    for (const [matchingKey, matchingAlgs] of candidates) {
      for (const alg of matchingAlgs) {
        return [matchingKey, alg]
      }
    }

    throw new TypeError(`No singing key found for ${kid || alg || '<unknown>'}`)
  }

  [Symbol.iterator](): IterableIterator<K> {
    return this.keys.values()
  }

  async sign(
    {alg: searchAlg, kid: searchKid, ...header}: JwtSignHeader,
    payload: JwtPayload | JwtPayloadGetter,
  ) {
    const [key, alg] = this.findSigningKey({alg: searchAlg, kid: searchKid})
    const protectedHeader = {...header, alg, kid: key.kid}

    if (typeof payload === 'function') {
      payload = await payload(protectedHeader, key)
    }

    return key.createJwt(protectedHeader, payload)
  }

  async verify<
    P extends Record<string, unknown> = JwtPayload,
    C extends string = string,
  >(token: Jwt, options?: VerifyOptions<C>) {
    const {header} = unsafeDecodeJwt(token)
    const {kid, alg} = header

    const errors: unknown[] = []

    for (const key of this.list({use: 'sig', kid, alg})) {
      try {
        return await key.verifyJwt<P, C>(token, options)
      } catch (err) {
        errors.push(err)
      }
    }

    throw new AggregateError(errors, 'Unable to verify signature')
  }
}
