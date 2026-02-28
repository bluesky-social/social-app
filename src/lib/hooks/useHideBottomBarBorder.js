import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
var HideBottomBarBorderContext = createContext(false);
HideBottomBarBorderContext.displayName = 'HideBottomBarBorderContext';
var HideBottomBarBorderSetterContext = createContext(null);
HideBottomBarBorderSetterContext.displayName =
    'HideBottomBarBorderSetterContext';
export function useHideBottomBarBorderSetter() {
    var hideBottomBarBorder = useContext(HideBottomBarBorderSetterContext);
    if (!hideBottomBarBorder) {
        throw new Error('useHideBottomBarBorderSetter must be used within a HideBottomBarBorderProvider');
    }
    return hideBottomBarBorder;
}
export function useHideBottomBarBorderForScreen() {
    var hideBorder = useHideBottomBarBorderSetter();
    useFocusEffect(useCallback(function () {
        var cleanup = hideBorder();
        return function () { return cleanup(); };
    }, [hideBorder]));
}
export function useHideBottomBarBorder() {
    return useContext(HideBottomBarBorderContext);
}
export function Provider(_a) {
    var children = _a.children;
    var _b = useState(0), refCount = _b[0], setRefCount = _b[1];
    var setter = useCallback(function () {
        setRefCount(function (prev) { return prev + 1; });
        return function () { return setRefCount(function (prev) { return prev - 1; }); };
    }, []);
    return (_jsx(HideBottomBarBorderSetterContext.Provider, { value: setter, children: _jsx(HideBottomBarBorderContext.Provider, { value: refCount > 0, children: children }) }));
}
