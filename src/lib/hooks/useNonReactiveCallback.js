import { useCallback, useInsertionEffect, useRef } from 'react';
// This should be used sparingly. It erases reactivity, i.e. when the inputs
// change, the function itself will remain the same. This means that if you
// use this at a higher level of your tree, and then some state you read in it
// changes, there is no mechanism for anything below in the tree to "react"
// to this change (e.g. by knowing to call your function again).
//
// Also, you should avoid calling the returned function during rendering
// since the values captured by it are going to lag behind.
export function useNonReactiveCallback(fn) {
    var ref = useRef(fn);
    useInsertionEffect(function () {
        ref.current = fn;
    }, [fn]);
    return useCallback(function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var latestFn = ref.current;
        return latestFn.apply(void 0, args);
    }, [ref]);
}
