import { useCallback, useRef } from 'react';
export function callOnce() {
    var ran = false;
    return function runCallbackOnce(cb) {
        if (ran)
            return;
        ran = true;
        cb();
    };
}
export function useCallOnce(cb) {
    var ran = useRef(false);
    return useCallback(function (icb) {
        if (ran.current)
            return;
        ran.current = true;
        if (icb)
            icb();
        else if (cb)
            cb();
    }, [cb]);
}
