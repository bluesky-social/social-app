import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { useSharedValue, withSpring, } from 'react-native-reanimated';
var stateContext = React.createContext({
    headerMode: {
        value: 0,
        addListener: function () { },
        removeListener: function () { },
        modify: function () { },
        get: function () {
            return 0;
        },
        set: function () { },
    },
    footerMode: {
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
stateContext.displayName = 'MinimalModeStateContext';
var setContext = React.createContext(function (_) { });
setContext.displayName = 'MinimalModeSetContext';
export function Provider(_a) {
    var children = _a.children;
    var headerMode = useSharedValue(0);
    var footerMode = useSharedValue(0);
    var setMode = React.useCallback(function (v) {
        'worklet';
        headerMode.set(function () {
            return withSpring(v ? 1 : 0, {
                overshootClamping: true,
            });
        });
        footerMode.set(function () {
            return withSpring(v ? 1 : 0, {
                overshootClamping: true,
            });
        });
    }, [headerMode, footerMode]);
    var value = React.useMemo(function () { return ({
        headerMode: headerMode,
        footerMode: footerMode,
    }); }, [headerMode, footerMode]);
    return (_jsx(stateContext.Provider, { value: value, children: _jsx(setContext.Provider, { value: setMode, children: children }) }));
}
export function useMinimalShellMode() {
    return React.useContext(stateContext);
}
export function useSetMinimalShellMode() {
    return React.useContext(setContext);
}
