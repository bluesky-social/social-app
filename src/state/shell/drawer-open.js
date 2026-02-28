import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState } from 'react';
var stateContext = createContext(false);
stateContext.displayName = 'DrawerOpenStateContext';
var setContext = createContext(function (_) { });
setContext.displayName = 'DrawerOpenSetContext';
export function Provider(_a) {
    var children = _a.children;
    var _b = useState(false), state = _b[0], setState = _b[1];
    return (_jsx(stateContext.Provider, { value: state, children: _jsx(setContext.Provider, { value: setState, children: children }) }));
}
export function useIsDrawerOpen() {
    return useContext(stateContext);
}
export function useSetDrawerOpen() {
    return useContext(setContext);
}
