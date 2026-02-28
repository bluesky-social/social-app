import { useEffect, useState } from 'react';
/**
 * Returns a debounced version of the input value that only updates after the
 * specified delay has passed without any changes to the input value.
 */
export function useDebouncedValue(val, delayMs) {
    var _a = useState(val), prev = _a[0], setPrev = _a[1];
    useEffect(function () {
        var timeout = setTimeout(function () { return setPrev(val); }, delayMs);
        return function () { return clearTimeout(timeout); };
    }, [val, delayMs]);
    return prev;
}
