import React from 'react';
export function useDelayedLoading(delay, initialState) {
    if (initialState === void 0) { initialState = true; }
    var _a = React.useState(initialState), isLoading = _a[0], setIsLoading = _a[1];
    React.useEffect(function () {
        var timeout;
        // on initial load, show a loading spinner for a hot sec to prevent flash
        if (isLoading)
            timeout = setTimeout(function () { return setIsLoading(false); }, delay);
        return function () { return timeout && clearTimeout(timeout); };
    }, [isLoading, delay]);
    return isLoading;
}
