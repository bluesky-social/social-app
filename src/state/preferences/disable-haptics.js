import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import * as persisted from '#/state/persisted';
var stateContext = React.createContext(Boolean(persisted.defaults.disableHaptics));
stateContext.displayName = 'DisableHapticsStateContext';
var setContext = React.createContext(function (_) { });
setContext.displayName = 'DisableHapticsSetContext';
export function Provider(_a) {
    var children = _a.children;
    var _b = React.useState(Boolean(persisted.get('disableHaptics'))), state = _b[0], setState = _b[1];
    var setStateWrapped = React.useCallback(function (hapticsEnabled) {
        setState(Boolean(hapticsEnabled));
        persisted.write('disableHaptics', hapticsEnabled);
    }, [setState]);
    React.useEffect(function () {
        return persisted.onUpdate('disableHaptics', function (nextDisableHaptics) {
            setState(Boolean(nextDisableHaptics));
        });
    }, [setStateWrapped]);
    return (_jsx(stateContext.Provider, { value: state, children: _jsx(setContext.Provider, { value: setStateWrapped, children: children }) }));
}
export var useHapticsDisabled = function () { return React.useContext(stateContext); };
export var useSetHapticsDisabled = function () { return React.useContext(setContext); };
