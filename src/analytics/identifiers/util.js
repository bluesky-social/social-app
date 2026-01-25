import * as env from '#/env';
var ONE_MIN = 60 * 1e3;
var TTL = (env.IS_NATIVE ? 5 : 30) * ONE_MIN; // 5 min on native
export function isSessionIdExpired(since) {
    if (since === undefined)
        return false;
    return Date.now() - since >= TTL;
}
