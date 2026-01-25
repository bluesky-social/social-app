import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
var stateContext = React.createContext(undefined);
stateContext.displayName = 'ActiveStarterPackStateContext';
var setContext = React.createContext(function (_) { });
setContext.displayName = 'ActiveStarterPackSetContext';
export function Provider(_a) {
    var children = _a.children;
    var _b = React.useState(), state = _b[0], setState = _b[1];
    return (_jsx(stateContext.Provider, { value: state, children: _jsx(setContext.Provider, { value: setState, children: children }) }));
}
export var useActiveStarterPack = function () { return React.useContext(stateContext); };
export var useSetActiveStarterPack = function () { return React.useContext(setContext); };
