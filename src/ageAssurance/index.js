import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { useGetAndRegisterPushToken } from '#/lib/notifications/notifications';
import { Provider as RedirectOverlayProvider } from '#/ageAssurance/components/RedirectOverlay';
import { AgeAssuranceDataProvider } from '#/ageAssurance/data';
import { useAgeAssuranceDataContext } from '#/ageAssurance/data';
import { logger } from '#/ageAssurance/logger';
import { useAgeAssuranceState, useOnAgeAssuranceAccessUpdate, } from '#/ageAssurance/state';
import { AgeAssuranceAccess, AgeAssuranceStatus, } from '#/ageAssurance/types';
import { isUnderAge, MIN_ACCESS_AGE, useAgeAssuranceRegionConfigWithFallback, } from '#/ageAssurance/util';
export { prefetchConfig as prefetchAgeAssuranceConfig, prefetchAgeAssuranceData, refetchServerState as refetchAgeAssuranceServerState, usePatchOtherRequiredData as usePatchAgeAssuranceOtherRequiredData, usePatchServerState as usePatchAgeAssuranceServerState, } from '#/ageAssurance/data';
export { logger } from '#/ageAssurance/logger';
export { MIN_ACCESS_AGE } from '#/ageAssurance/util';
var AgeAssuranceStateContext = createContext({
    Access: AgeAssuranceAccess,
    Status: AgeAssuranceStatus,
    state: {
        lastInitiatedAt: undefined,
        status: AgeAssuranceStatus.Unknown,
        access: AgeAssuranceAccess.Full,
    },
    flags: {
        adultContentDisabled: false,
        chatDisabled: false,
        isOverRegionMinAccessAge: false,
        isOverAppMinAccessAge: false,
    },
});
/**
 * THE MAIN AGE ASSURANCE CONTEXT HOOK
 *
 * Prefer this to using any of the lower-level data-provider hooks.
 */
export function useAgeAssurance() {
    return useContext(AgeAssuranceStateContext);
}
export function Provider(_a) {
    var children = _a.children;
    return (_jsx(AgeAssuranceDataProvider, { children: _jsx(InnerProvider, { children: _jsx(RedirectOverlayProvider, { children: children }) }) }));
}
function InnerProvider(_a) {
    var children = _a.children;
    var state = useAgeAssuranceState();
    var data = useAgeAssuranceDataContext().data;
    var config = useAgeAssuranceRegionConfigWithFallback();
    var getAndRegisterPushToken = useGetAndRegisterPushToken();
    var handleAccessUpdate = useCallback(function (s) {
        getAndRegisterPushToken({
            isAgeRestricted: s.access !== AgeAssuranceAccess.Full,
        });
    }, [getAndRegisterPushToken]);
    useOnAgeAssuranceAccessUpdate(handleAccessUpdate);
    useEffect(function () {
        logger.debug("useAgeAssuranceState", { state: state });
    }, [state]);
    return (_jsx(AgeAssuranceStateContext.Provider, { value: useMemo(function () {
            var chatDisabled = state.access !== AgeAssuranceAccess.Full;
            var isUnderAdultAge = (data === null || data === void 0 ? void 0 : data.birthdate)
                ? isUnderAge(data.birthdate, 18)
                : true;
            var isOverRegionMinAccessAge = (data === null || data === void 0 ? void 0 : data.birthdate)
                ? !isUnderAge(data.birthdate, config.minAccessAge)
                : false;
            var isOverAppMinAccessAge = (data === null || data === void 0 ? void 0 : data.birthdate)
                ? !isUnderAge(data.birthdate, MIN_ACCESS_AGE)
                : false;
            var adultContentDisabled = state.access !== AgeAssuranceAccess.Full || isUnderAdultAge;
            return {
                Access: AgeAssuranceAccess,
                Status: AgeAssuranceStatus,
                state: state,
                flags: {
                    adultContentDisabled: adultContentDisabled,
                    chatDisabled: chatDisabled,
                    isOverRegionMinAccessAge: isOverRegionMinAccessAge,
                    isOverAppMinAccessAge: isOverAppMinAccessAge,
                },
            };
        }, [state, data, config]), children: children }));
}
