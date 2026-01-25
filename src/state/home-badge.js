import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
var stateContext = React.createContext(false);
stateContext.displayName = 'HomeBadgeStateContext';
var apiContext = React.createContext(function (_) { });
apiContext.displayName = 'HomeBadgeApiContext';
export function Provider(_a) {
    var children = _a.children;
    var _b = React.useState(false), state = _b[0], setState = _b[1];
    return (_jsx(stateContext.Provider, { value: state, children: _jsx(apiContext.Provider, { value: setState, children: children }) }));
}
export function useHomeBadge() {
    return React.useContext(stateContext);
}
export function useSetHomeBadge() {
    return React.useContext(apiContext);
}
