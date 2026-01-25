import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import * as persisted from '#/state/persisted';
var StateContext = React.createContext({
    trendingDisabled: Boolean(persisted.defaults.trendingDisabled),
    trendingVideoDisabled: Boolean(persisted.defaults.trendingVideoDisabled),
});
StateContext.displayName = 'TrendingStateContext';
var ApiContext = React.createContext({
    setTrendingDisabled: function () { },
    setTrendingVideoDisabled: function () { },
});
ApiContext.displayName = 'TrendingApiContext';
function usePersistedBooleanValue(key) {
    var _a = React.useState(function () {
        return Boolean(persisted.get(key));
    }), value = _a[0], _set = _a[1];
    var set = React.useCallback(function (hidden) {
        _set(Boolean(hidden));
        persisted.write(key, hidden);
    }, [key, _set]);
    React.useEffect(function () {
        return persisted.onUpdate(key, function (hidden) {
            _set(Boolean(hidden));
        });
    }, [key, _set]);
    return [value, set];
}
export function Provider(_a) {
    var children = _a.children;
    var _b = usePersistedBooleanValue('trendingDisabled'), trendingDisabled = _b[0], setTrendingDisabled = _b[1];
    var _c = usePersistedBooleanValue('trendingVideoDisabled'), trendingVideoDisabled = _c[0], setTrendingVideoDisabled = _c[1];
    /*
     * Context
     */
    var state = React.useMemo(function () { return ({ trendingDisabled: trendingDisabled, trendingVideoDisabled: trendingVideoDisabled }); }, [trendingDisabled, trendingVideoDisabled]);
    var api = React.useMemo(function () { return ({ setTrendingDisabled: setTrendingDisabled, setTrendingVideoDisabled: setTrendingVideoDisabled }); }, [setTrendingDisabled, setTrendingVideoDisabled]);
    return (_jsx(StateContext.Provider, { value: state, children: _jsx(ApiContext.Provider, { value: api, children: children }) }));
}
export function useTrendingSettings() {
    return React.useContext(StateContext);
}
export function useTrendingSettingsApi() {
    return React.useContext(ApiContext);
}
