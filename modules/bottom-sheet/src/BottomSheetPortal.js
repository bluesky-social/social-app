import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { createPortalGroup_INTERNAL } from './lib/Portal';
export var Context = React.createContext({});
Context.displayName = 'BottomSheetPortalContext';
export var useBottomSheetPortal_INTERNAL = function () { return React.useContext(Context); };
export function BottomSheetPortalProvider(_a) {
    var children = _a.children;
    var portal = React.useMemo(function () {
        return createPortalGroup_INTERNAL();
    }, []);
    return (_jsx(Context.Provider, { value: portal.Portal, children: _jsxs(portal.Provider, { children: [children, _jsx(portal.Outlet, {})] }) }));
}
var defaultPortal = createPortalGroup_INTERNAL();
export var BottomSheetOutlet = defaultPortal.Outlet;
export function BottomSheetProvider(_a) {
    var children = _a.children;
    return (_jsx(Context.Provider, { value: defaultPortal.Portal, children: _jsx(defaultPortal.Provider, { children: children }) }));
}
