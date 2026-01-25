import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import * as persisted from '#/state/persisted';
var stateContext = React.createContext(Boolean(persisted.defaults.disableAutoplay));
stateContext.displayName = 'AutoplayStateContext';
var setContext = React.createContext(function (_) { });
setContext.displayName = 'AutoplaySetContext';
export function Provider(_a) {
    var children = _a.children;
    var _b = React.useState(Boolean(persisted.get('disableAutoplay'))), state = _b[0], setState = _b[1];
    var setStateWrapped = React.useCallback(function (autoplayDisabled) {
        setState(Boolean(autoplayDisabled));
        persisted.write('disableAutoplay', autoplayDisabled);
    }, [setState]);
    React.useEffect(function () {
        return persisted.onUpdate('disableAutoplay', function (nextDisableAutoplay) {
            setState(Boolean(nextDisableAutoplay));
        });
    }, [setStateWrapped]);
    return (_jsx(stateContext.Provider, { value: state, children: _jsx(setContext.Provider, { value: setStateWrapped, children: children }) }));
}
export var useAutoplayDisabled = function () { return React.useContext(stateContext); };
export var useSetAutoplayDisabled = function () { return React.useContext(setContext); };
