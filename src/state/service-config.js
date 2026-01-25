import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useMemo } from 'react';
import { useLanguagePrefs } from '#/state/preferences/languages';
import { useServiceConfigQuery } from '#/state/queries/service-config';
import { useSession } from '#/state/session';
import { useAnalytics } from '#/analytics';
import { IS_DEV } from '#/env';
import { device } from '#/storage';
var TrendingContext = createContext({
    enabled: false,
});
TrendingContext.displayName = 'TrendingContext';
var LiveNowContext = createContext([]);
LiveNowContext.displayName = 'LiveNowContext';
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
    var liveNow = useMemo(function () { var _a; return (_a = config === null || config === void 0 ? void 0 : config.liveNow) !== null && _a !== void 0 ? _a : []; }, [config]);
    // probably true, so default to true when loading
    // if the call fails, the query will set it to false for us
    var checkEmailConfirmed = (_b = config === null || config === void 0 ? void 0 : config.checkEmailConfirmed) !== null && _b !== void 0 ? _b : true;
    return (_jsx(TrendingContext.Provider, { value: trending, children: _jsx(LiveNowContext.Provider, { value: liveNow, children: _jsx(CheckEmailConfirmedContext.Provider, { value: checkEmailConfirmed, children: children }) }) }));
}
export function useTrendingConfig() {
    return useContext(TrendingContext);
}
var DEFAULT_LIVE_ALLOWED_DOMAINS = [
    'twitch.tv',
    'www.twitch.tv',
    'stream.place',
    'bluecast.app',
    'www.bluecast.app',
];
export function useLiveNowConfig() {
    var ctx = useContext(LiveNowContext);
    var canGoLive = useCanGoLive();
    var currentAccount = useSession().currentAccount;
    if (!(currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did) || !canGoLive)
        return { allowedDomains: new Set() };
    var vip = ctx.find(function (live) { return live.did === currentAccount.did; });
    return {
        allowedDomains: new Set(DEFAULT_LIVE_ALLOWED_DOMAINS.concat(vip ? vip.domains : [])),
    };
}
export function useCanGoLive() {
    var ax = useAnalytics();
    var hasSession = useSession().hasSession;
    if (!hasSession)
        return false;
    return IS_DEV ? true : !ax.features.enabled(ax.features.LiveNowBetaDisable);
}
export function useCheckEmailConfirmed() {
    var ctx = useContext(CheckEmailConfirmedContext);
    if (ctx === null) {
        throw new Error('useCheckEmailConfirmed must be used within a ServiceConfigManager');
    }
    return ctx;
}
