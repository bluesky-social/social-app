import { useEffect } from 'react';
import { useGlobalGestureEvents, } from '#/state/global-gesture-events';
/**
 * Listen for global gesture events. Callback should be wrapped with
 * `useCallback` or otherwise memoized to avoid unnecessary re-renders.
 */
export function useOnGesture(onGestureCallback) {
    var ctx = useGlobalGestureEvents();
    useEffect(function () {
        ctx.register();
        ctx.events.on('begin', onGestureCallback);
        return function () {
            ctx.unregister();
            ctx.events.off('begin', onGestureCallback);
        };
    }, [ctx, onGestureCallback]);
}
