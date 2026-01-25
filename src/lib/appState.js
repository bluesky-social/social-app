import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
export var getCurrentState = function () { return AppState.currentState; };
export function onAppStateChange(cb) {
    var prev = AppState.currentState;
    return AppState.addEventListener('change', function (next) {
        if (next === prev)
            return;
        prev = next;
        cb(next);
    });
}
export function useOnAppStateChange(cb) {
    useEffect(function () {
        var sub = onAppStateChange(function (next) { return cb(next); });
        return function () { return sub.remove(); };
    }, [cb]);
}
export function useAppState() {
    var _a = useState(AppState.currentState), state = _a[0], setState = _a[1];
    useOnAppStateChange(setState);
    return state;
}
