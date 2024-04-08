import { z } from 'zod'

import { jwkPubSchema, jwkSchema } from './jwk.js'

export const jwksSchema = z
  .object({
    keys: z.array(jwkSchema).readonly(),
  })
  .readonly()

export type Jwks = z.infer<typeof jwksSchema>

export const jwksPubSchema = z
  .object({
    keys: z.array(jwkPubSchema).readonly(),
  })
  .readonly()

export type JwksPub = z.infer<typeof jwksPubSchema>
