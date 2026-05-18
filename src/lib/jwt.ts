import {jwtDecode} from 'jwt-decode'

import {logger} from '#/logger'

/**
 * Simple check if a JWT token has expired. Does *not* validate the token or check for revocation status,
 * just checks the expiration time.
 *
 * @param token The JWT token to check.
 * @returns `true` if the token has expired, `false` otherwise.
 */
export function isJwtExpired(token: string) {
  try {
    const payload = jwtDecode(token)

    if (!payload.exp) return true
    const now = Math.floor(Date.now() / 1000)
    return now >= payload.exp
  } catch {
    logger.error(`session: could not decode jwt`)
    return true // invalid token or parse error
  }
}

export function isAppPassword(token: string) {
  try {
    const payload = jwtDecode(token)
    // @ts-ignore
    return payload.scope === 'com.atproto.appPass'
  } catch {
    // OAuth / DPoP access tokens are not app-password JWTs and may not be
    // decodable; treat as not-an-app-password instead of throwing.
    logger.error(`session: could not decode jwt in isAppPassword`)
    return false
  }
}
