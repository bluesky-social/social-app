import { useCallback } from 'react';
import { computeAgeAssuranceRegionAccess } from '@atproto/api';
import { useAgeAssuranceDataContext } from '#/ageAssurance/data';
import { logger } from '#/ageAssurance/logger';
import { AgeAssuranceAccess, parseAccessFromString } from '#/ageAssurance/types';
import { getAgeAssuranceRegionConfigWithFallback } from '#/ageAssurance/util';
export function useComputeAgeAssuranceRegionAccess() {
    var _a = useAgeAssuranceDataContext(), config = _a.config, data = _a.data;
    return useCallback(function (geolocation) {
        if (!config) {
            logger.warn('useComputeAgeAssuranceRegionAccess: missing config');
            return AgeAssuranceAccess.Unknown;
        }
        var region = getAgeAssuranceRegionConfigWithFallback(config, geolocation);
        var result = computeAgeAssuranceRegionAccess(region, data);
        return result
            ? parseAccessFromString(result.access)
            : AgeAssuranceAccess.Full;
    }, [config, data]);
}
