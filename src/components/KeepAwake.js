import { jsx as _jsx } from "react/jsx-runtime";
import { useId } from 'react';
import { useKeepAwake } from 'expo-keep-awake';
import { useIsFocused } from '@react-navigation/native';
/**
 * Stops the screen from sleeping. Only applies to the current screen.
 *
 * Note: Expo keeps the screen permanently awake when in dev mode, so
 * you'll only see this do anything when in production.
 *
 * @platform ios, android
 */
export function KeepAwake(_a) {
    var _b = _a.enabled, enabled = _b === void 0 ? true : _b;
    var isFocused = useIsFocused();
    if (enabled && isFocused) {
        return _jsx(KeepAwakeInner, {});
    }
    else {
        return null;
    }
}
function KeepAwakeInner() {
    var id = useId();
    // if you don't pass an explicit ID, any `useKeepAwake` hook unmounting disables them all.
    // very strange behaviour, but easily fixed by passing a unique ID -sfn
    useKeepAwake(id);
    return null;
}
