export type JWSAlgorithm =
  // HMAC
  | 'HS256'
  | 'HS384'
  | 'HS512'
  // RSA
  | 'PS256'
  | 'PS384'
  | 'PS512'
  | 'RS256'
  | 'RS384'
  | 'RS512'
  // EC
  | 'ES256'
  | 'ES256K'
  | 'ES384'
  | 'ES512'
  // OKP
  | 'EdDSA'

// TODO REVIEW POLYFILL
// @ts-ignore Polyfilled
export type SubtleAlgorithm = RsaHashedKeyGenParams | EcKeyGenParams

export function toSubtleAlgorithm(
  alg: string,
  crv?: string,
  options?: {modulusLength?: number},
): SubtleAlgorithm {
  switch (alg) {
    case 'PS256':
    case 'PS384':
    case 'PS512':
      return {
        name: 'RSA-PSS',
        hash: `SHA-${alg.slice(-3) as '256' | '384' | '512'}`,
        modulusLength: options?.modulusLength ?? 2048,
        publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
      }
    case 'RS256':
    case 'RS384':
    case 'RS512':
      return {
        name: 'RSASSA-PKCS1-v1_5',
        hash: `SHA-${alg.slice(-3) as '256' | '384' | '512'}`,
        modulusLength: options?.modulusLength ?? 2048,
        publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
      }
    case 'ES256':
    case 'ES384':
      return {
        name: 'ECDSA',
        namedCurve: `P-${alg.slice(-3) as '256' | '384'}`,
      }
    case 'ES512':
      return {
        name: 'ECDSA',
        namedCurve: 'P-521',
      }
    default:
      // https://github.com/w3c/webcrypto/issues/82#issuecomment-849856773

      throw new TypeError(`Unsupported alg "${alg}"`)
  }
}

// TODO REVIEW POLYFILL
// @ts-ignore Polyfilled
export function fromSubtleAlgorithm(algorithm: KeyAlgorithm): JWSAlgorithm {
  switch (algorithm.name) {
    case 'RSA-PSS':
    case 'RSASSA-PKCS1-v1_5': {
      // TODO REVIEW POLYFILL
      // @ts-ignore Polyfilled
      const hash = (<RsaHashedKeyAlgorithm>algorithm).hash.name
      switch (hash) {
        case 'SHA-256':
        case 'SHA-384':
        case 'SHA-512': {
          const prefix = algorithm.name === 'RSA-PSS' ? 'PS' : 'RS'
          return `${prefix}${hash.slice(-3) as '256' | '384' | '512'}`
        }
        default:
          throw new TypeError('unsupported RsaHashedKeyAlgorithm hash')
      }
    }
    case 'ECDSA': {
      // TODO REVIEW POLYFILL
      // @ts-ignore Polyfilled
      const namedCurve = (<EcKeyAlgorithm>algorithm).namedCurve
      switch (namedCurve) {
        case 'P-256':
        case 'P-384':
        case 'P-512':
          return `ES${namedCurve.slice(-3) as '256' | '384' | '512'}`
        case 'P-521':
          return 'ES512'
        default:
          throw new TypeError('unsupported EcKeyAlgorithm namedCurve')
      }
    }
    case 'Ed448':
    case 'Ed25519':
      return 'EdDSA'
    default:
      // https://github.com/w3c/webcrypto/issues/82#issuecomment-849856773

      throw new TypeError(`Unexpected algorithm "${algorithm.name}"`)
  }
}

export function isSignatureKeyPair(
  v: unknown,
  extractable?: boolean,
  // TODO REVIEW POLYFILL
  // @ts-ignore Polyfilled
): v is CryptoKeyPair {
  return (
    typeof v === 'object' &&
    v !== null &&
    'privateKey' in v &&
    // TODO REVIEW POLYFILL
    // @ts-ignore Polyfilled
    v.privateKey instanceof CryptoKey &&
    v.privateKey.type === 'private' &&
    (extractable == null || v.privateKey.extractable === extractable) &&
    v.privateKey.usages.includes('sign') &&
    'publicKey' in v &&
    // TODO REVIEW POLYFILL
    // @ts-ignore Polyfilled
    v.publicKey instanceof CryptoKey &&
    v.publicKey.type === 'public' &&
    v.publicKey.extractable === true &&
    v.publicKey.usages.includes('verify')
  )
}

export async function generateKeypair(
  algs: string[],
  extractable = false,
  // TODO REVIEW POLYFILL
  // @ts-ignore Polyfilled
): Promise<CryptoKeyPair> {
  const errors: unknown[] = []
  for (const alg of algs) {
    try {
      // TODO REVIEW POLYFILL
      // @ts-ignore Polyfilled
      return await crypto.subtle.generateKey(
        toSubtleAlgorithm(alg),
        extractable,
        ['sign', 'verify'],
      )
    } catch (err) {
      errors.push(err)
    }
  }

  throw new AggregateError(errors, 'Failed to generate keypair')
}
