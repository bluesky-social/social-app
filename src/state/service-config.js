import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useMemo } from 'react';
import { useLanguagePrefs } from '#/state/preferences/languages';
import { useServiceConfigQuery } from '#/state/queries/service-config';
import { device } from '#/storage';
var TrendingContext = createContext({
    enabled: false,
});
TrendingContext.displayName = 'TrendingContext';
var CheckEmailConfirmedContext = createContext(null);
export function Provider(_a) {
    var _b;
    var children = _a.children;
    var langPrefs = useLanguagePrefs();
    var _c = useServiceConfigQuery(), config = _c.data, isInitialLoad = _c.isLoading;
    var trending = useMemo(function () {
        if (__DEV__) {
            return { enabled: true };
        }
        /*
         * Only English during beta period
         */
        if (!!langPrefs.contentLanguages.length &&
            !langPrefs.contentLanguages.includes('en')) {
            return { enabled: false };
        }
        /*
         * While loading, use cached value
         */
        var cachedEnabled = device.get(['trendingBetaEnabled']);
        if (isInitialLoad) {
            return { enabled: Boolean(cachedEnabled) };
        }
        var enabled = Boolean(config === null || config === void 0 ? void 0 : config.topicsEnabled);
        // update cache
        device.set(['trendingBetaEnabled'], enabled);
        return { enabled: enabled };
    }, [isInitialLoad, config, langPrefs.contentLanguages]);
    // probably true, so default to true when loading
    // if the call fails, the query will set it to false for us
    var checkEmailConfirmed = (_b = config === null || config === void 0 ? void 0 : config.checkEmailConfirmed) !== null && _b !== void 0 ? _b : true;
    return (_jsx(TrendingContext.Provider, { value: trending, children: _jsx(CheckEmailConfirmedContext.Provider, { value: checkEmailConfirmed, children: children }) }));
}
export function useTrendingConfig() {
    return useContext(TrendingContext);
}
export function useCheckEmailConfirmed() {
    var ctx = useContext(CheckEmailConfirmedContext);
    if (ctx === null) {
        throw new Error('useCheckEmailConfirmed must be used within a ServiceConfigManager');
    }
    return ctx;
}
