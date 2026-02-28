var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { useMemo } from 'react';
import { ageAssuranceRuleIDs as ids, getAgeAssuranceRegionConfig, } from '@atproto/api';
import { getAge } from '#/lib/strings/time';
import { DEFAULT_LOGGED_OUT_LABEL_PREFERENCES } from '#/state/queries/preferences/moderation';
import { useAgeAssuranceDataContext } from '#/ageAssurance/data';
import { AgeAssuranceAccess } from '#/ageAssurance/types';
import { useGeolocation } from '#/geolocation';
export var MIN_ACCESS_AGE = 13;
var FALLBACK_REGION_CONFIG = {
    countryCode: '*',
    regionCode: undefined,
    minAccessAge: MIN_ACCESS_AGE,
    rules: [
        {
            $type: ids.IfDeclaredOverAge,
            age: MIN_ACCESS_AGE,
            access: AgeAssuranceAccess.Full,
        },
        {
            $type: ids.Default,
            access: AgeAssuranceAccess.None,
        },
    ],
};
/**
 * Get age assurance region config based on geolocation, with fallback to
 * app defaults if no region config is found.
 *
 * See {@link getAgeAssuranceRegionConfig} for the generic option, which can
 * return undefined if the geolocation does not match any AA region.
 */
export function getAgeAssuranceRegionConfigWithFallback(config, geolocation) {
    var _a;
    var region = getAgeAssuranceRegionConfig(config, {
        countryCode: (_a = geolocation.countryCode) !== null && _a !== void 0 ? _a : '',
        regionCode: geolocation.regionCode,
    });
    return region || FALLBACK_REGION_CONFIG;
}
/**
 * Hook to get the age assurance region config based on current geolocation.
 * Does not fall-back to our app defaults. If no config is found, returns
 * undefined, which indicates no regional age assurance rules apply.
 */
export function useAgeAssuranceRegionConfig() {
    var geolocation = useGeolocation();
    var config = useAgeAssuranceDataContext().config;
    return useMemo(function () {
        var _a;
        if (!config)
            return;
        // use generic helper, we want to potentially return undefined
        return getAgeAssuranceRegionConfig(config, {
            countryCode: (_a = geolocation.countryCode) !== null && _a !== void 0 ? _a : '',
            regionCode: geolocation.regionCode,
        });
    }, [config, geolocation]);
}
/**
 * Hook to get the age assurance region config based on current geolocation.
 * Falls back to our app defaults if no region config is found.
 */
export function useAgeAssuranceRegionConfigWithFallback() {
    return useAgeAssuranceRegionConfig() || FALLBACK_REGION_CONFIG;
}
/**
 * Some users may have erroneously set their birth date to the current date
 * if one wasn't set on their account. We previously didn't do validation on
 * the bday dialog, and it defaulted to the current date. This bug _has_ been
 * seen in production, so we need to check for it where possible.
 */
export function isLegacyBirthdateBug(birthDate) {
    return ['2025', '2024', '2023'].includes((birthDate || '').slice(0, 4));
}
/**
 * Returns whether the date (converted to an age as a whole integer) is under
 * the provided minimum age.
 */
export function isUnderAge(birthDate, age) {
    return getAge(new Date(birthDate)) < age;
}
export function getBirthdateStringFromAge(age) {
    var today = new Date();
    return new Date(today.getFullYear() - age, today.getMonth(), today.getDate() - 1).toISOString();
}
export var makeAgeRestrictedModerationPrefs = function (prefs) { return (__assign(__assign({}, prefs), { adultContentEnabled: false, labels: DEFAULT_LOGGED_OUT_LABEL_PREFERENCES })); };
