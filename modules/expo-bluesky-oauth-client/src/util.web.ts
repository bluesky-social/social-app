// @ts-ignore web only, this silences errors throughout the whole file for crypto being missing
const crypto = global.crypto

export async function generateKeyPair(algs: string[], extractable = false) {
  const errors: unknown[] = []
  try {
    return await crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: `P-256`,
      },
      extractable,
      ['sign', 'verify'],
    )
  } catch (err) {
    errors.push(err)
  }

  console.log(errors)
  throw new AggregateError(errors, 'Failed to generate keypair')
}

export function isSignatureKeyPair(
  v: unknown,
  extractable?: boolean,
): v is CryptoKeyPair {
  return (
    typeof v === 'object' &&
    v !== null &&
    'privateKey' in v &&
    v.privateKey instanceof CryptoKey &&
    v.privateKey.type === 'private' &&
    (extractable == null || v.privateKey.extractable === extractable) &&
    v.privateKey.usages.includes('sign') &&
    'publicKey' in v &&
    v.publicKey instanceof CryptoKey &&
    v.publicKey.type === 'public' &&
    v.publicKey.extractable === true &&
    v.publicKey.usages.includes('verify')
  )
}
