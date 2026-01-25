import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import * as persisted from '#/state/persisted';
var stateContext = React.createContext(false);
stateContext.displayName = 'UsedStarterPacksStateContext';
var setContext = React.createContext(function (_) { });
setContext.displayName = 'UsedStarterPacksSetContext';
export function Provider(_a) {
    var children = _a.children;
    var _b = React.useState(function () {
        return persisted.get('hasCheckedForStarterPack');
    }), state = _b[0], setState = _b[1];
    var setStateWrapped = function (v) {
        setState(v);
        persisted.write('hasCheckedForStarterPack', v);
    };
    React.useEffect(function () {
        return persisted.onUpdate('hasCheckedForStarterPack', function (nextHasCheckedForStarterPack) {
            setState(nextHasCheckedForStarterPack);
        });
    }, []);
    return (_jsx(stateContext.Provider, { value: state, children: _jsx(setContext.Provider, { value: setStateWrapped, children: children }) }));
}
export var useHasCheckedForStarterPack = function () { return React.useContext(stateContext); };
export var useSetHasCheckedForStarterPack = function () { return React.useContext(setContext); };
