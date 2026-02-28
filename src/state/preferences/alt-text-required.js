import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import * as persisted from '#/state/persisted';
var stateContext = React.createContext(persisted.defaults.requireAltTextEnabled);
stateContext.displayName = 'AltTextRequiredStateContext';
var setContext = React.createContext(function (_) { });
setContext.displayName = 'AltTextRequiredSetContext';
export function Provider(_a) {
    var children = _a.children;
    var _b = React.useState(persisted.get('requireAltTextEnabled')), state = _b[0], setState = _b[1];
    var setStateWrapped = React.useCallback(function (requireAltTextEnabled) {
        setState(requireAltTextEnabled);
        persisted.write('requireAltTextEnabled', requireAltTextEnabled);
    }, [setState]);
    React.useEffect(function () {
        return persisted.onUpdate('requireAltTextEnabled', function (nextRequireAltTextEnabled) {
            setState(nextRequireAltTextEnabled);
        });
    }, [setStateWrapped]);
    return (_jsx(stateContext.Provider, { value: state, children: _jsx(setContext.Provider, { value: setStateWrapped, children: children }) }));
}
export function useRequireAltTextEnabled() {
    return React.useContext(stateContext);
}
export function useSetRequireAltTextEnabled() {
    return React.useContext(setContext);
}
