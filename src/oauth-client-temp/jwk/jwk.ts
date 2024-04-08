import { z } from 'zod'

export const keyUsageSchema = z.enum([
  'sign',
  'verify',
  'encrypt',
  'decrypt',
  'wrapKey',
  'unwrapKey',
  'deriveKey',
  'deriveBits',
])

export type KeyUsage = z.infer<typeof keyUsageSchema>

/**
 * The "use" and "key_ops" JWK members SHOULD NOT be used together;
 * however, if both are used, the information they convey MUST be
 * consistent.  Applications should specify which of these members they
 * use, if either is to be used by the application.
 *
 * @todo Actually check that "use" and "key_ops" are consistent when both are present.
 * @see {@link https://datatracker.ietf.org/doc/html/rfc7517#section-4.3}
 */
export const jwkBaseSchema = z.object({
  kty: z.string().min(1),
  alg: z.string().min(1).optional(),
  kid: z.string().min(1).optional(),
  ext: z.boolean().optional(),
  use: z.enum(['sig', 'enc']).optional(),
  key_ops: z.array(keyUsageSchema).readonly().optional(),

  x5c: z.array(z.string()).readonly().optional(), // X.509 Certificate Chain
  x5t: z.string().min(1).optional(), // X.509 Certificate SHA-1 Thumbprint
  'x5t#S256': z.string().min(1).optional(), // X.509 Certificate SHA-256 Thumbprint
  x5u: z.string().url().optional(), // X.509 URL
})

/**
 * @todo: properly implement this
 */
export const jwkRsaKeySchema = jwkBaseSchema
  .extend({
    kty: z.literal('RSA'),
    alg: z
      .enum(['RS256', 'RS384', 'RS512', 'PS256', 'PS384', 'PS512'])
      .optional(),

    n: z.string().min(1), // Modulus
    e: z.string().min(1), // Exponent

    d: z.string().min(1).optional(), // Private Exponent
    p: z.string().min(1).optional(), // First Prime Factor
    q: z.string().min(1).optional(), // Second Prime Factor
    dp: z.string().min(1).optional(), // First Factor CRT Exponent
    dq: z.string().min(1).optional(), // Second Factor CRT Exponent
    qi: z.string().min(1).optional(), // First CRT Coefficient
    oth: z
      .array(
        z
          .object({
            r: z.string().optional(),
            d: z.string().optional(),
            t: z.string().optional(),
          })
          .readonly(),
      )
      .nonempty()
      .readonly()
      .optional(), // Other Primes Info
  })
  .readonly()

export const jwkEcKeySchema = jwkBaseSchema
  .extend({
    kty: z.literal('EC'),
    alg: z.enum(['ES256', 'ES384', 'ES512']).optional(),
    crv: z.enum(['P-256', 'P-384', 'P-521']),

    x: z.string().min(1),
    y: z.string().min(1),

    d: z.string().min(1).optional(), // ECC Private Key
  })
  .readonly()

export const jwkEcSecp256k1KeySchema = jwkBaseSchema
  .extend({
    kty: z.literal('EC'),
    alg: z.enum(['ES256K']).optional(),
    crv: z.enum(['secp256k1']),

    x: z.string().min(1),
    y: z.string().min(1),

    d: z.string().min(1).optional(), // ECC Private Key
  })
  .readonly()

export const jwkOkpKeySchema = jwkBaseSchema
  .extend({
    kty: z.literal('OKP'),
    alg: z.enum(['EdDSA']).optional(),
    crv: z.enum(['Ed25519', 'Ed448']),

    x: z.string().min(1),
    d: z.string().min(1).optional(), // ECC Private Key
  })
  .readonly()

export const jwkSymKeySchema = jwkBaseSchema
  .extend({
    kty: z.literal('oct'), // Octet Sequence (used to represent symmetric keys)
    alg: z.enum(['HS256', 'HS384', 'HS512']).optional(),

    k: z.string(), // Key Value (base64url encoded)
  })
  .readonly()

export const jwkUnknownKeySchema = jwkBaseSchema
  .extend({
    kty: z
      .string()
      .refine((v) => v !== 'RSA' && v !== 'EC' && v !== 'OKP' && v !== 'oct'),
  })
  .readonly()

export const jwkSchema = z.union([
  jwkUnknownKeySchema,
  jwkRsaKeySchema,
  jwkEcKeySchema,
  jwkEcSecp256k1KeySchema,
  jwkOkpKeySchema,
  jwkSymKeySchema,
])

export type Jwk = z.infer<typeof jwkSchema>

export const jwkPubSchema = jwkSchema
  .refine((k) => k.kid != null, 'kid is required')
  .refine((k) => k.use != null || k.key_ops != null, 'use or key_ops required')
  .refine(
    (k) =>
      !k.use ||
      !k.key_ops ||
      k.key_ops.every((o) =>
        k.use === 'sig'
          ? o === 'sign' || o === 'verify'
          : o === 'encrypt' || o === 'decrypt',
      ),
    'use and key_ops must be consistent',
  )
  .refine((k) => !('k' in k) && !('d' in k), 'private key not allowed')
