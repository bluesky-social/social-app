import { useEffect, useMemo, useState } from 'react';
import { computeAgeAssuranceRegionAccess } from '@atproto/api';
import { useSession } from '#/state/session';
import { useAgeAssuranceDataContext } from '#/ageAssurance/data';
import { logger } from '#/ageAssurance/logger';
import { AgeAssuranceAccess, AgeAssuranceStatus, parseAccessFromString, parseStatusFromString, } from '#/ageAssurance/types';
import { getAgeAssuranceRegionConfigWithFallback } from '#/ageAssurance/util';
import { useGeolocation } from '#/geolocation';
export function useAgeAssuranceState() {
    var hasSession = useSession().hasSession;
    var geolocation = useGeolocation();
    var _a = useAgeAssuranceDataContext(), config = _a.config, state = _a.state, data = _a.data;
    return useMemo(function () {
        /**
         * This is where we control logged-out moderation prefs. It's all
         * downstream of AA now.
         */
        if (!hasSession)
            return {
                status: AgeAssuranceStatus.Unknown,
                access: AgeAssuranceAccess.Safe,
            };
        /**
         * This can happen if the prefetch fails (such as due to network issues).
         * The query handler will try it again, but if it continues to fail, of
         * course we won't have config.
         *
         * In this case, fail open to avoid blocking users.
         */
        if (!config) {
            logger.warn('useAgeAssuranceState: missing config');
            return {
                status: AgeAssuranceStatus.Unknown,
                access: AgeAssuranceAccess.Safe,
                error: 'config',
            };
        }
        var region = getAgeAssuranceRegionConfigWithFallback(config, geolocation);
        var isAARequired = region.countryCode !== '*';
        var isTerminalState = (state === null || state === void 0 ? void 0 : state.status) === 'assured' || (state === null || state === void 0 ? void 0 : state.status) === 'blocked';
        /*
         * If we are in a terminal state and AA is required for this region,
         * we can trust the server state completely and avoid recomputing.
         */
        if (isTerminalState && isAARequired) {
            return {
                lastInitiatedAt: state.lastInitiatedAt,
                status: parseStatusFromString(state.status),
                access: parseAccessFromString(state.access),
            };
        }
        /*
         * Otherwise, we need to compute the access based on the latest data. For
         * accounts with an accurate birthdate, our default fallback rules should
         * ensure correct access.
         */
        var result = computeAgeAssuranceRegionAccess(region, data);
        var computed = {
            lastInitiatedAt: state === null || state === void 0 ? void 0 : state.lastInitiatedAt,
            // prefer server state
            status: (state === null || state === void 0 ? void 0 : state.status)
                ? parseStatusFromString(state === null || state === void 0 ? void 0 : state.status)
                : AgeAssuranceStatus.Unknown,
            // prefer server state
            access: result
                ? parseAccessFromString(result.access)
                : AgeAssuranceAccess.Full,
        };
        logger.debug('debug useAgeAssuranceState', {
            region: region,
            state: state,
            data: data,
            computed: computed,
        });
        return computed;
    }, [hasSession, geolocation, config, state, data]);
}
export function useOnAgeAssuranceAccessUpdate(cb) {
    var state = useAgeAssuranceState();
    // start with null to ensure callback is called on first render
    var _a = useState(null), prevAccess = _a[0], setPrevAccess = _a[1];
    useEffect(function () {
        if (prevAccess !== state.access) {
            setPrevAccess(state.access);
            cb(state);
            logger.debug("useOnAgeAssuranceAccessUpdate", { state: state });
        }
    }, [cb, state, prevAccess]);
}
