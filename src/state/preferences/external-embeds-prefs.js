var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import * as persisted from '#/state/persisted';
var stateContext = React.createContext(persisted.defaults.externalEmbeds);
stateContext.displayName = 'ExternalEmbedsPrefsStateContext';
var setContext = React.createContext({});
setContext.displayName = 'ExternalEmbedsPrefsSetContext';
export function Provider(_a) {
    var children = _a.children;
    var _b = React.useState(persisted.get('externalEmbeds')), state = _b[0], setState = _b[1];
    var setStateWrapped = React.useCallback(function (source, value) {
        setState(function (prev) {
            var _a, _b;
            persisted.write('externalEmbeds', __assign(__assign({}, prev), (_a = {}, _a[source] = value, _a)));
            return __assign(__assign({}, prev), (_b = {}, _b[source] = value, _b));
        });
    }, [setState]);
    React.useEffect(function () {
        return persisted.onUpdate('externalEmbeds', function (nextExternalEmbeds) {
            setState(nextExternalEmbeds);
        });
    }, [setStateWrapped]);
    return (_jsx(stateContext.Provider, { value: state, children: _jsx(setContext.Provider, { value: setStateWrapped, children: children }) }));
}
export function useExternalEmbedsPrefs() {
    return React.useContext(stateContext);
}
export function useSetExternalEmbedPref() {
    return React.useContext(setContext);
}
