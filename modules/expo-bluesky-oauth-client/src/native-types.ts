export interface CryptoKey {
  algorithm: {
    name: 'ECDSA'
    namedCurve: 'P-256'
  }
  extractable: boolean
  type: 'public' | 'private'
  usages: ('sign' | 'verify')[]
}

export interface NativeJWKKey {
  crv: 'P-256'
  ext: boolean
  kty: 'EC'
  x: string
  y: string
  use: 'sig'
  alg: 'ES256'
  kid: string
}
