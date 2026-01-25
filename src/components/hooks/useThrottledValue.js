import { useEffect, useRef, useState } from 'react';
import { useNonReactiveCallback } from '#/lib/hooks/useNonReactiveCallback';
export function useThrottledValue(value, time) {
    var pendingValueRef = useRef(value);
    var _a = useState(value), throttledValue = _a[0], setThrottledValue = _a[1];
    useEffect(function () {
        pendingValueRef.current = value;
    }, [value]);
    var handleTick = useNonReactiveCallback(function () {
        if (pendingValueRef.current !== throttledValue) {
            setThrottledValue(pendingValueRef.current);
        }
    });
    useEffect(function () {
        var id = setInterval(handleTick, time);
        return function () {
            clearInterval(id);
        };
    }, [handleTick, time]);
    return throttledValue;
}
