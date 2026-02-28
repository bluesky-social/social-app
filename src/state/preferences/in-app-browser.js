import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import * as persisted from '#/state/persisted';
var stateContext = React.createContext(persisted.defaults.useInAppBrowser);
stateContext.displayName = 'InAppBrowserStateContext';
var setContext = React.createContext(function (_) { });
setContext.displayName = 'InAppBrowserSetContext';
export function Provider(_a) {
    var children = _a.children;
    var _b = React.useState(persisted.get('useInAppBrowser')), state = _b[0], setState = _b[1];
    var setStateWrapped = React.useCallback(function (inAppBrowser) {
        setState(inAppBrowser);
        persisted.write('useInAppBrowser', inAppBrowser);
    }, [setState]);
    React.useEffect(function () {
        return persisted.onUpdate('useInAppBrowser', function (nextUseInAppBrowser) {
            setState(nextUseInAppBrowser);
        });
    }, [setStateWrapped]);
    return (_jsx(stateContext.Provider, { value: state, children: _jsx(setContext.Provider, { value: setStateWrapped, children: children }) }));
}
export function useInAppBrowser() {
    return React.useContext(stateContext);
}
export function useSetInAppBrowser() {
    return React.useContext(setContext);
}
