var _a;
import { IS_ANDROID } from '#/env';
import { logger } from '#/geolocation/logger';
import { device } from '#/storage';
/**
 * Maps full US region names to their short codes.
 *
 * Context: in some cases, like on Android, we get the full region name instead
 * of the short code. We may need to expand this in the future to other
 * countries, hence the prefix.
 */
export var USRegionNameToRegionCode = (_a = {
        Alabama: 'AL',
        Alaska: 'AK',
        Arizona: 'AZ',
        Arkansas: 'AR',
        California: 'CA',
        Colorado: 'CO',
        Connecticut: 'CT',
        Delaware: 'DE',
        Florida: 'FL',
        Georgia: 'GA',
        Hawaii: 'HI',
        Idaho: 'ID',
        Illinois: 'IL',
        Indiana: 'IN',
        Iowa: 'IA',
        Kansas: 'KS',
        Kentucky: 'KY',
        Louisiana: 'LA',
        Maine: 'ME',
        Maryland: 'MD',
        Massachusetts: 'MA',
        Michigan: 'MI',
        Minnesota: 'MN',
        Mississippi: 'MS',
        Missouri: 'MO',
        Montana: 'MT',
        Nebraska: 'NE',
        Nevada: 'NV'
    },
    _a['New Hampshire'] = 'NH',
    _a['New Jersey'] = 'NJ',
    _a['New Mexico'] = 'NM',
    _a['New York'] = 'NY',
    _a['North Carolina'] = 'NC',
    _a['North Dakota'] = 'ND',
    _a.Ohio = 'OH',
    _a.Oklahoma = 'OK',
    _a.Oregon = 'OR',
    _a.Pennsylvania = 'PA',
    _a['Rhode Island'] = 'RI',
    _a['South Carolina'] = 'SC',
    _a['South Dakota'] = 'SD',
    _a.Tennessee = 'TN',
    _a.Texas = 'TX',
    _a.Utah = 'UT',
    _a.Vermont = 'VT',
    _a.Virginia = 'VA',
    _a.Washington = 'WA',
    _a['West Virginia'] = 'WV',
    _a.Wisconsin = 'WI',
    _a.Wyoming = 'WY',
    _a);
/**
 * Normalizes a `LocationGeocodedAddress` into a `Geolocation`.
 *
 * We don't want or care about the full location data, so we trim it down and
 * normalize certain fields, like region, into the format we need.
 */
export function normalizeDeviceLocation(location) {
    var _a;
    var isoCountryCode = location.isoCountryCode, region = location.region;
    var regionCode = region !== null && region !== void 0 ? region : undefined;
    /*
     * Android doesn't give us ISO 3166-2 short codes. We need these for US
     */
    if (IS_ANDROID) {
        if (region && isoCountryCode === 'US') {
            /*
             * We need short codes for US states. If we can't remap it, just drop it
             * entirely for now.
             */
            regionCode = (_a = USRegionNameToRegionCode[region]) !== null && _a !== void 0 ? _a : undefined;
        }
        else {
            /*
             * Outside the US, we don't need regionCodes for now, so just drop it.
             */
            regionCode = undefined;
        }
    }
    return {
        countryCode: isoCountryCode !== null && isoCountryCode !== void 0 ? isoCountryCode : undefined,
        regionCode: regionCode,
    };
}
/**
 * Combines precise location data with the geolocation config fetched from the
 * IP service, with preference to the precise data.
 */
export function mergeGeolocations(device, geolocationService) {
    var _a, _b;
    var geolocation = {
        countryCode: (_a = geolocationService === null || geolocationService === void 0 ? void 0 : geolocationService.countryCode) !== null && _a !== void 0 ? _a : undefined,
        regionCode: (_b = geolocationService === null || geolocationService === void 0 ? void 0 : geolocationService.regionCode) !== null && _b !== void 0 ? _b : undefined,
    };
    // prefer GPS
    if (device === null || device === void 0 ? void 0 : device.countryCode) {
        geolocation = device;
    }
    logger.debug('merged geolocation data', {
        device: device,
        service: geolocationService,
        merged: geolocation,
    });
    return geolocation;
}
/**
 * Gets the IP-based geolocation as a string in the format of
 * "countryCode-regionCode", or just "countryCode" if regionCode is not
 * available.
 *
 * IMPORTANT: this method should only return IP-based data, not the user's GPS
 * based data. IP-based data we can already infer from requests, but for
 * consistency between frontend and backend, we sometimes want to share the
 * value we have on the frontend with the backend.
 */
export function getIPGeolocationString() {
    var geo = device.get(['geolocationServiceResponse']);
    if (!geo)
        return;
    var countryCode = geo.countryCode, regionCode = geo.regionCode;
    if (countryCode) {
        if (regionCode) {
            return "".concat(countryCode, "-").concat(regionCode);
        }
        else {
            return countryCode;
        }
    }
}
