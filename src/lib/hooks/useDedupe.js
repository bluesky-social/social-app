import { useCallback, useRef } from 'react';
export function useDedupe(timeout) {
    if (timeout === void 0) { timeout = 250; }
    var canDo = useRef(true);
    return useCallback(function (cb) {
        if (canDo.current) {
            canDo.current = false;
            setTimeout(function () {
                canDo.current = true;
            }, timeout);
            cb();
            return true;
        }
        return false;
    }, [timeout]);
}
