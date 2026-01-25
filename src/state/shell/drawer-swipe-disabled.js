import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
var stateContext = React.createContext(false);
stateContext.displayName = 'DrawerSwipeDisabledStateContext';
var setContext = React.createContext(function (_) { });
setContext.displayName = 'DrawerSwipeDisabledSetContext';
export function Provider(_a) {
    var children = _a.children;
    var _b = React.useState(false), state = _b[0], setState = _b[1];
    return (_jsx(stateContext.Provider, { value: state, children: _jsx(setContext.Provider, { value: setState, children: children }) }));
}
export function useIsDrawerSwipeDisabled() {
    return React.useContext(stateContext);
}
export function useSetDrawerSwipeDisabled() {
    return React.useContext(setContext);
}
