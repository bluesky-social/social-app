import * as React from 'react';
/**
 * Helper hook to run persistent timers on views
 */
export function useTimer(time, handler) {
    var timer = React.useRef(undefined);
    // function to restart the timer
    var reset = React.useCallback(function () {
        if (timer.current) {
            clearTimeout(timer.current);
        }
        timer.current = setTimeout(handler, time);
    }, [time, timer, handler]);
    // function to cancel the timer
    var cancel = React.useCallback(function () {
        if (timer.current) {
            clearTimeout(timer.current);
            timer.current = undefined;
        }
    }, [timer]);
    // start the timer immediately
    React.useEffect(function () {
        reset();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return [reset, cancel];
}
