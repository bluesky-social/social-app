import {Jwk} from './jwk'

declare const process: undefined | {versions?: {node?: string}}
const IS_NODE_RUNTIME =
  typeof process !== 'undefined' && typeof process?.versions?.node === 'string'

export function* jwkAlgorithms(jwk: Jwk): Generator<string> {
  // Ed25519, Ed448, and secp256k1 always have "alg"
  // OKP always has "use"
  if (jwk.alg) {
    yield jwk.alg
    return
  }

  switch (jwk.kty) {
    case 'EC': {
      if (jwk.use === 'enc' || jwk.use === undefined) {
        yield 'ECDH-ES'
        yield 'ECDH-ES+A128KW'
        yield 'ECDH-ES+A192KW'
        yield 'ECDH-ES+A256KW'
      }

      if (jwk.use === 'sig' || jwk.use === undefined) {
        const crv = 'crv' in jwk ? jwk.crv : undefined
        switch (crv) {
          case 'P-256':
          case 'P-384':
            yield `ES${crv.slice(-3)}`.replace('21', '12')
            break
          case 'P-521':
            yield 'ES512'
            break
          case 'secp256k1':
            if (IS_NODE_RUNTIME) yield 'ES256K'
            break
          default:
            throw new TypeError(`Unsupported crv "${crv}"`)
        }
      }

      return
    }

    case 'OKP': {
      if (!jwk.use) throw new TypeError('Missing "use" Parameter value')
      yield 'ECDH-ES'
      yield 'ECDH-ES+A128KW'
      yield 'ECDH-ES+A192KW'
      yield 'ECDH-ES+A256KW'
      return
    }

    case 'RSA': {
      if (jwk.use === 'enc' || jwk.use === undefined) {
        yield 'RSA-OAEP'
        yield 'RSA-OAEP-256'
        yield 'RSA-OAEP-384'
        yield 'RSA-OAEP-512'
        if (IS_NODE_RUNTIME) yield 'RSA1_5'
      }

      if (jwk.use === 'sig' || jwk.use === undefined) {
        yield 'PS256'
        yield 'PS384'
        yield 'PS512'
        yield 'RS256'
        yield 'RS384'
        yield 'RS512'
      }

      return
    }

    case 'oct': {
      if (jwk.use === 'enc' || jwk.use === undefined) {
        yield 'A128GCMKW'
        yield 'A192GCMKW'
        yield 'A256GCMKW'
        yield 'A128KW'
        yield 'A192KW'
        yield 'A256KW'
      }

      if (jwk.use === 'sig' || jwk.use === undefined) {
        yield 'HS256'
        yield 'HS384'
        yield 'HS512'
      }

      return
    }

    default:
      throw new Error(`Unsupported kty "${jwk.kty}"`)
  }
}
