var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { useSession } from '#/state/session';
import { useActiveStarterPack } from '#/state/shell/starter-pack';
import { IS_WEB } from '#/env';
var StateContext = React.createContext({
    showLoggedOut: false,
    requestedAccountSwitchTo: undefined,
});
StateContext.displayName = 'LoggedOutStateContext';
var ControlsContext = React.createContext({
    setShowLoggedOut: function () { },
    requestSwitchToAccount: function () { },
    clearRequestedAccount: function () { },
});
ControlsContext.displayName = 'LoggedOutControlsContext';
export function Provider(_a) {
    var children = _a.children;
    var activeStarterPack = useActiveStarterPack();
    var hasSession = useSession().hasSession;
    var shouldShowStarterPack = Boolean(activeStarterPack === null || activeStarterPack === void 0 ? void 0 : activeStarterPack.uri) && !hasSession;
    var _b = React.useState({
        showLoggedOut: shouldShowStarterPack,
        requestedAccountSwitchTo: shouldShowStarterPack
            ? IS_WEB
                ? 'starterpack'
                : 'new'
            : undefined,
    }), state = _b[0], setState = _b[1];
    var controls = React.useMemo(function () { return ({
        setShowLoggedOut: function (show) {
            setState(function (s) { return (__assign(__assign({}, s), { showLoggedOut: show })); });
        },
        requestSwitchToAccount: function (_a) {
            var requestedAccount = _a.requestedAccount;
            setState(function (s) { return (__assign(__assign({}, s), { showLoggedOut: true, requestedAccountSwitchTo: requestedAccount })); });
        },
        clearRequestedAccount: function () {
            setState(function (s) { return (__assign(__assign({}, s), { requestedAccountSwitchTo: undefined })); });
        },
    }); }, [setState]);
    return (_jsx(StateContext.Provider, { value: state, children: _jsx(ControlsContext.Provider, { value: controls, children: children }) }));
}
export function useLoggedOutView() {
    return React.useContext(StateContext);
}
export function useLoggedOutViewControls() {
    return React.useContext(ControlsContext);
}
