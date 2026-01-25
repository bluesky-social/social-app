import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, } from 'react';
import { KeyboardProvider, useKeyboardController, } from 'react-native-keyboard-controller';
import { useFocusEffect } from '@react-navigation/native';
var KeyboardControllerRefCountContext = createContext({
    incrementRefCount: function () { },
    decrementRefCount: function () { },
});
KeyboardControllerRefCountContext.displayName =
    'KeyboardControllerRefCountContext';
export function KeyboardControllerProvider(_a) {
    var children = _a.children;
    return (_jsx(KeyboardProvider, { enabled: false, children: _jsx(KeyboardControllerProviderInner, { children: children }) }));
}
function KeyboardControllerProviderInner(_a) {
    var children = _a.children;
    var setEnabled = useKeyboardController().setEnabled;
    var refCount = useRef(0);
    var value = useMemo(function () { return ({
        incrementRefCount: function () {
            refCount.current++;
            setEnabled(refCount.current > 0);
        },
        decrementRefCount: function () {
            refCount.current--;
            setEnabled(refCount.current > 0);
            if (__DEV__ && refCount.current < 0) {
                console.error('KeyboardController ref count < 0');
            }
        },
    }); }, [setEnabled]);
    return (_jsx(KeyboardControllerRefCountContext.Provider, { value: value, children: children }));
}
export function useEnableKeyboardController(shouldEnable) {
    var _a = useContext(KeyboardControllerRefCountContext), incrementRefCount = _a.incrementRefCount, decrementRefCount = _a.decrementRefCount;
    useEffect(function () {
        if (!shouldEnable) {
            return;
        }
        incrementRefCount();
        return function () {
            decrementRefCount();
        };
    }, [shouldEnable, incrementRefCount, decrementRefCount]);
}
/**
 * Like `useEnableKeyboardController`, but using `useFocusEffect`
 */
export function useEnableKeyboardControllerScreen(shouldEnable) {
    var _a = useContext(KeyboardControllerRefCountContext), incrementRefCount = _a.incrementRefCount, decrementRefCount = _a.decrementRefCount;
    useFocusEffect(useCallback(function () {
        if (!shouldEnable) {
            return;
        }
        incrementRefCount();
        return function () {
            decrementRefCount();
        };
    }, [shouldEnable, incrementRefCount, decrementRefCount]));
}
