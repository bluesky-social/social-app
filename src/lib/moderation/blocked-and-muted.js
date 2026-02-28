export function isBlockedOrBlocking(profile) {
    var _a, _b;
    return ((_a = profile.viewer) === null || _a === void 0 ? void 0 : _a.blockedBy) || ((_b = profile.viewer) === null || _b === void 0 ? void 0 : _b.blocking);
}
export function isMuted(profile) {
    var _a, _b;
    return ((_a = profile.viewer) === null || _a === void 0 ? void 0 : _a.muted) || ((_b = profile.viewer) === null || _b === void 0 ? void 0 : _b.mutedByList);
}
