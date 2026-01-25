import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { useSharedValue } from 'react-native-reanimated';
var stateContext = React.createContext({
    headerHeight: {
        value: 0,
        addListener: function () { },
        removeListener: function () { },
        modify: function () { },
        get: function () {
            return 0;
        },
        set: function () { },
    },
    footerHeight: {
        value: 0,
        addListener: function () { },
        removeListener: function () { },
        modify: function () { },
        get: function () {
            return 0;
        },
        set: function () { },
    },
});
stateContext.displayName = 'ShellLayoutContext';
export function Provider(_a) {
    var children = _a.children;
    var headerHeight = useSharedValue(0);
    var footerHeight = useSharedValue(0);
    var value = React.useMemo(function () { return ({
        headerHeight: headerHeight,
        footerHeight: footerHeight,
    }); }, [headerHeight, footerHeight]);
    return _jsx(stateContext.Provider, { value: value, children: children });
}
export function useShellLayout() {
    return React.useContext(stateContext);
}
