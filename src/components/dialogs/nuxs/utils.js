export function createIsEnabledCheck(cb) {
    return cb;
}
var ONE_DAY = 1000 * 60 * 60 * 24;
export function isDaysOld(days, createdAt) {
    /*
     * Should never happen because we gate NUXs to only accounts with a valid
     * profile and a `createdAt` (see `nuxs/index.tsx`). But if it ever did, the
     * account is either old enough to be pre-onboarding, or some failure happened
     * during account creation. Fail closed. - esb
     */
    if (!createdAt)
        return false;
    var now = Date.now();
    var then = new Date(createdAt).getTime();
    var isOldEnough = then + ONE_DAY * days < now;
    if (isOldEnough)
        return true;
    return false;
}
export function isExistingUserAsOf(date, createdAt) {
    /*
     * Should never happen because we gate NUXs to only accounts with a valid
     * profile and a `createdAt` (see `nuxs/index.tsx`). But if it ever did, the
     * account is either old enough to be pre-onboarding, or some failure happened
     * during account creation. Fail closed. - esb
     */
    if (!createdAt)
        return false;
    var threshold = Date.parse(date);
    var then = new Date(createdAt).getTime();
    return then < threshold;
}
