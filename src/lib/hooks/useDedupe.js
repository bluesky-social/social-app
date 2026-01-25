import React from 'react';
export var useDedupe = function (timeout) {
    if (timeout === void 0) { timeout = 250; }
    var canDo = React.useRef(true);
    return React.useCallback(function (cb) {
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
};
