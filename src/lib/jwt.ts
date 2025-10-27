/**
 * Simple check if a JWT token has expired. Does *not* validate the token or check for revocation status,
 * just checks the expiration time.
 *
 * @param token The JWT token to check.
 * @returns `true` if the token has expired, `false` otherwise.
 */
export function isJwtExpired(token: string) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = JSON.parse(atob(base64))
    const exp = jsonPayload.exp

    if (!exp) return false // No exp claim
    const now = Math.floor(Date.now() / 1000)
    return now >= exp
  } catch {
    return true // invalid token or parse error
  }
}
