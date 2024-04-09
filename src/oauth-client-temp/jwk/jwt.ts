import {z} from 'zod'

import {jwkPubSchema} from './jwk'

export const JWT_REGEXP = /^[A-Za-z0-9_-]{2,}(?:\.[A-Za-z0-9_-]{2,}){1,2}$/
export const jwtSchema = z
  .string()
  .min(5)
  .refinement(
    (data: string): data is `${string}.${string}.${string}` =>
      JWT_REGEXP.test(data),
    {
      code: z.ZodIssueCode.custom,
      message: 'Must be a JWT',
    },
  )

export const isJwt = (data: unknown): data is Jwt =>
  jwtSchema.safeParse(data).success

export type Jwt = z.infer<typeof jwtSchema>

/**
 * @see {@link https://www.rfc-editor.org/rfc/rfc7515.html#section-4}
 */
export const jwtHeaderSchema = z.object({
  /** "alg" (Algorithm) Header Parameter */
  alg: z.string(),
  /** "jku" (JWK Set URL) Header Parameter */
  jku: z.string().url().optional(),
  /** "jwk" (JSON Web Key) Header Parameter */
  jwk: z
    .object({
      kty: z.string(),
      crv: z.string().optional(),
      x: z.string().optional(),
      y: z.string().optional(),
      e: z.string().optional(),
      n: z.string().optional(),
    })
    .optional(),
  /** "kid" (Key ID) Header Parameter */
  kid: z.string().optional(),
  /** "x5u" (X.509 URL) Header Parameter */
  x5u: z.string().optional(),
  /** "x5c" (X.509 Certificate Chain) Header Parameter */
  x5c: z.array(z.string()).optional(),
  /** "x5t" (X.509 Certificate SHA-1 Thumbprint) Header Parameter */
  x5t: z.string().optional(),
  /** "x5t#S256" (X.509 Certificate SHA-256 Thumbprint) Header Parameter */
  'x5t#S256': z.string().optional(),
  /** "typ" (Type) Header Parameter */
  typ: z.string().optional(),
  /** "cty" (Content Type) Header Parameter */
  cty: z.string().optional(),
  /** "crit" (Critical) Header Parameter */
  crit: z.array(z.string()).optional(),
})

export type JwtHeader = z.infer<typeof jwtHeaderSchema>

// https://www.iana.org/assignments/jwt/jwt.xhtml
export const jwtPayloadSchema = z.object({
  iss: z.string().optional(),
  aud: z.union([z.string(), z.array(z.string()).nonempty()]).optional(),
  sub: z.string().optional(),
  exp: z.number().int().optional(),
  nbf: z.number().int().optional(),
  iat: z.number().int().optional(),
  jti: z.string().optional(),
  htm: z.string().optional(),
  htu: z.string().optional(),
  ath: z.string().optional(),
  acr: z.string().optional(),
  azp: z.string().optional(),
  amr: z.array(z.string()).optional(),
  // https://datatracker.ietf.org/doc/html/rfc7800
  cnf: z
    .object({
      kid: z.string().optional(), // Key ID
      jwk: jwkPubSchema.optional(), // JWK
      jwe: z.string().optional(), // Encrypted key
      jku: z.string().url().optional(), // JWK Set URI ("kid" should also be provided)

      // https://datatracker.ietf.org/doc/html/rfc9449#section-6.1
      jkt: z.string().optional(),

      // https://datatracker.ietf.org/doc/html/rfc8705
      'x5t#S256': z.string().optional(), // X.509 Certificate SHA-256 Thumbprint

      // https://datatracker.ietf.org/doc/html/rfc9203
      osc: z.string().optional(), // OSCORE_Input_Material carrying the parameters for using OSCORE per-message security with implicit key confirmation
    })
    .optional(),

  client_id: z.string().optional(),

  scope: z.string().optional(),
  nonce: z.string().optional(),

  at_hash: z.string().optional(),
  c_hash: z.string().optional(),
  s_hash: z.string().optional(),
  auth_time: z.number().int().optional(),

  // https://openid.net/specs/openid-connect-core-1_0.html#StandardClaims

  // OpenID: "profile" scope
  name: z.string().optional(),
  family_name: z.string().optional(),
  given_name: z.string().optional(),
  middle_name: z.string().optional(),
  nickname: z.string().optional(),
  preferred_username: z.string().optional(),
  gender: z.string().optional(), // OpenID only defines "male" and "female" without forbidding other values
  picture: z.string().url().optional(),
  profile: z.string().url().optional(),
  website: z.string().url().optional(),
  birthdate: z
    .string()
    .regex(/\d{4}-\d{2}-\d{2}/) // YYYY-MM-DD
    .optional(),
  zoneinfo: z
    .string()
    .regex(/^[A-Za-z0-9_/]+$/)
    .optional(),
  locale: z
    .string()
    .regex(/^[a-z]{2}(-[A-Z]{2})?$/)
    .optional(),
  updated_at: z.number().int().optional(),

  // OpenID: "email" scope
  email: z.string().optional(),
  email_verified: z.boolean().optional(),

  // OpenID: "phone" scope
  phone_number: z.string().optional(),
  phone_number_verified: z.boolean().optional(),

  // OpenID: "address" scope
  // https://openid.net/specs/openid-connect-core-1_0.html#AddressClaim
  address: z
    .object({
      formatted: z.string().optional(),
      street_address: z.string().optional(),
      locality: z.string().optional(),
      region: z.string().optional(),
      postal_code: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),

  // https://datatracker.ietf.org/doc/html/rfc9396#section-14.2
  authorization_details: z
    .array(
      z
        .object({
          type: z.string(),
          // https://datatracker.ietf.org/doc/html/rfc9396#section-2.2
          locations: z.array(z.string()).optional(),
          actions: z.array(z.string()).optional(),
          datatypes: z.array(z.string()).optional(),
          identifier: z.string().optional(),
          privileges: z.array(z.string()).optional(),
        })
        .passthrough(),
    )
    .optional(),
})

export type JwtPayload = z.infer<typeof jwtPayloadSchema>
