import { b64uDecode } from '@atproto/b64'

import { ui8ToString } from './util.js'
import {
  JwtHeader,
  JwtPayload,
  jwtHeaderSchema,
  jwtPayloadSchema,
} from './jwt.js'

export function unsafeDecodeJwt(jwt: string): {
  header: JwtHeader
  payload: JwtPayload
} {
  const { 0: headerEnc, 1: payloadEnc, length } = jwt.split('.')
  if (length > 3 || length < 2) {
    throw new TypeError('invalid JWT input')
  }

  const header = jwtHeaderSchema.parse(
    JSON.parse(ui8ToString(b64uDecode(headerEnc!))),
  )
  if (length === 2 && header?.alg !== 'none') {
    throw new TypeError('invalid JWT input')
  }

  const payload = jwtPayloadSchema.parse(
    JSON.parse(ui8ToString(b64uDecode(payloadEnc!))),
  )

  return { header, payload }
}
