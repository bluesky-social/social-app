import { IS_DEV } from '#/env';
import { useGeolocation } from '#/geolocation';
var FIND_CONTACTS_FEATURE_COUNTRY_ALLOWLIST = [
    'US',
    'GB',
    'JP',
    'CA',
    'DE',
    'FR',
    'ES',
    'BR',
    'KR',
    'NL',
    'AU',
    'SE',
    'IT',
];
export function isFindContactsFeatureEnabled(countryCode) {
    if (IS_DEV)
        return true;
    /*
     * This should never happen unless geolocation fails entirely. In that
     * case, let the user try, since it should work as long as they have a
     * phone number from one of the allow-listed countries.
     */
    if (!countryCode)
        return true;
    return FIND_CONTACTS_FEATURE_COUNTRY_ALLOWLIST.includes(countryCode.toUpperCase());
}
export function useIsFindContactsFeatureEnabledBasedOnGeolocation() {
    var location = useGeolocation();
    return isFindContactsFeatureEnabled(location.countryCode);
}
