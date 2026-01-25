import { jwtDecode } from 'jwt-decode';
import { logger } from '#/logger';
/**
 * Simple check if a JWT token has expired. Does *not* validate the token or check for revocation status,
 * just checks the expiration time.
 *
 * @param token The JWT token to check.
 * @returns `true` if the token has expired, `false` otherwise.
 */
export function isJwtExpired(token) {
    try {
        var payload = jwtDecode(token);
        if (!payload.exp)
            return true;
        var now = Math.floor(Date.now() / 1000);
        return now >= payload.exp;
    }
    catch (_a) {
        logger.error("session: could not decode jwt");
        return true; // invalid token or parse error
    }
}
export function isAppPassword(token) {
    var payload = jwtDecode(token);
    // @ts-ignore
    return payload.scope === 'com.atproto.appPass';
}
