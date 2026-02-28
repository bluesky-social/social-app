import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import * as persisted from '#/state/persisted';
var stateContext = React.createContext(persisted.defaults.largeAltBadgeEnabled);
stateContext.displayName = 'LargeAltBadgeStateContext';
var setContext = React.createContext(function (_) { });
setContext.displayName = 'LargeAltBadgeSetContext';
export function Provider(_a) {
    var children = _a.children;
    var _b = React.useState(persisted.get('largeAltBadgeEnabled')), state = _b[0], setState = _b[1];
    var setStateWrapped = React.useCallback(function (largeAltBadgeEnabled) {
        setState(largeAltBadgeEnabled);
        persisted.write('largeAltBadgeEnabled', largeAltBadgeEnabled);
    }, [setState]);
    React.useEffect(function () {
        return persisted.onUpdate('largeAltBadgeEnabled', function (nextLargeAltBadgeEnabled) {
            setState(nextLargeAltBadgeEnabled);
        });
    }, [setStateWrapped]);
    return (_jsx(stateContext.Provider, { value: state, children: _jsx(setContext.Provider, { value: setStateWrapped, children: children }) }));
}
export function useLargeAltBadgeEnabled() {
    return React.useContext(stateContext);
}
export function useSetLargeAltBadgeEnabled() {
    return React.useContext(setContext);
}
