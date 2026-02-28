import { GEOLOCATION_URL } from '#/env';
export var GEOLOCATION_SERVICE_URL = "".concat(GEOLOCATION_URL, "/geolocation");
/**
 * Default geolocation config.
 */
export var FALLBACK_GEOLOCATION_SERVICE_RESPONSE = {
    countryCode: undefined,
    regionCode: undefined,
};
