var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import * as persisted from '#/state/persisted';
var stateContext = React.createContext(persisted.defaults.hiddenPosts);
stateContext.displayName = 'HiddenPostsStateContext';
var apiContext = React.createContext({
    hidePost: function () { },
    unhidePost: function () { },
});
apiContext.displayName = 'HiddenPostsApiContext';
export function Provider(_a) {
    var children = _a.children;
    var _b = React.useState(persisted.get('hiddenPosts')), state = _b[0], setState = _b[1];
    var setStateWrapped = React.useCallback(function (fn) {
        var s = fn(persisted.get('hiddenPosts'));
        setState(s);
        persisted.write('hiddenPosts', s);
    }, [setState]);
    var api = React.useMemo(function () { return ({
        hidePost: function (_a) {
            var uri = _a.uri;
            setStateWrapped(function (s) { return __spreadArray(__spreadArray([], (s || []), true), [uri], false); });
        },
        unhidePost: function (_a) {
            var uri = _a.uri;
            setStateWrapped(function (s) { return (s || []).filter(function (u) { return u !== uri; }); });
        },
    }); }, [setStateWrapped]);
    React.useEffect(function () {
        return persisted.onUpdate('hiddenPosts', function (nextHiddenPosts) {
            setState(nextHiddenPosts);
        });
    }, [setStateWrapped]);
    return (_jsx(stateContext.Provider, { value: state, children: _jsx(apiContext.Provider, { value: api, children: children }) }));
}
export function useHiddenPosts() {
    return React.useContext(stateContext);
}
export function useHiddenPostsApi() {
    return React.useContext(apiContext);
}
