var navigationMetadata;
export function getNavigationMetadata() {
    return navigationMetadata;
}
export function setNavigationMetadata(meta) {
    navigationMetadata = meta;
}
/**
 * We don't want or need to send all data to the logger
 */
export function getMetadataForLogger(_a) {
    var base = _a.base, geolocation = _a.geolocation, session = _a.session;
    return {
        deviceId: base.deviceId,
        sessionId: base.sessionId,
        platform: base.platform,
        appVersion: base.appVersion,
        countryCode: geolocation.countryCode,
        regionCode: geolocation.regionCode,
        isBskyPds: (session === null || session === void 0 ? void 0 : session.isBskyPds) || 'anonymous',
    };
}
