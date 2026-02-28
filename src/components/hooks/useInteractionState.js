import React from 'react';
export function useInteractionState() {
    var _a = React.useState(false), state = _a[0], setState = _a[1];
    var onIn = React.useCallback(function () {
        setState(true);
    }, []);
    var onOut = React.useCallback(function () {
        setState(false);
    }, []);
    return React.useMemo(function () { return ({
        state: state,
        onIn: onIn,
        onOut: onOut,
    }); }, [state, onIn, onOut]);
}
