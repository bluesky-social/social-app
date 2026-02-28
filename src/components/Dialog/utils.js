import React from 'react';
export function useAutoOpen(control, showTimeout) {
    React.useEffect(function () {
        if (showTimeout) {
            var timeout_1 = setTimeout(function () {
                control.open();
            }, showTimeout);
            return function () {
                clearTimeout(timeout_1);
            };
        }
        else {
            control.open();
        }
    }, [control, showTimeout]);
}
