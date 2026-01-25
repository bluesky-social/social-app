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
var StateContext = React.createContext({
    uris: new Set(),
    recentlyUnhiddenUris: new Set(),
});
StateContext.displayName = 'ThreadgateHiddenRepliesStateContext';
var ApiContext = React.createContext({
    addHiddenReplyUri: function () { },
    removeHiddenReplyUri: function () { },
});
ApiContext.displayName = 'ThreadgateHiddenRepliesApiContext';
export function Provider(_a) {
    var children = _a.children;
    var _b = React.useState(new Set()), uris = _b[0], setHiddenReplyUris = _b[1];
    var _c = React.useState(new Set()), recentlyUnhiddenUris = _c[0], setRecentlyUnhiddenUris = _c[1];
    var stateCtx = React.useMemo(function () { return ({
        uris: uris,
        recentlyUnhiddenUris: recentlyUnhiddenUris,
    }); }, [uris, recentlyUnhiddenUris]);
    var apiCtx = React.useMemo(function () { return ({
        addHiddenReplyUri: function (uri) {
            setHiddenReplyUris(function (prev) { return new Set(prev.add(uri)); });
            setRecentlyUnhiddenUris(function (prev) {
                prev.delete(uri);
                return new Set(prev);
            });
        },
        removeHiddenReplyUri: function (uri) {
            setHiddenReplyUris(function (prev) {
                prev.delete(uri);
                return new Set(prev);
            });
            setRecentlyUnhiddenUris(function (prev) { return new Set(prev.add(uri)); });
        },
    }); }, [setHiddenReplyUris]);
    return (_jsx(ApiContext.Provider, { value: apiCtx, children: _jsx(StateContext.Provider, { value: stateCtx, children: children }) }));
}
export function useThreadgateHiddenReplyUris() {
    return React.useContext(StateContext);
}
export function useThreadgateHiddenReplyUrisAPI() {
    return React.useContext(ApiContext);
}
export function useMergedThreadgateHiddenReplies(_a) {
    var threadgateRecord = _a.threadgateRecord;
    var _b = useThreadgateHiddenReplyUris(), uris = _b.uris, recentlyUnhiddenUris = _b.recentlyUnhiddenUris;
    return React.useMemo(function () {
        var set = new Set(__spreadArray(__spreadArray([], ((threadgateRecord === null || threadgateRecord === void 0 ? void 0 : threadgateRecord.hiddenReplies) || []), true), uris, true));
        for (var _i = 0, recentlyUnhiddenUris_1 = recentlyUnhiddenUris; _i < recentlyUnhiddenUris_1.length; _i++) {
            var uri = recentlyUnhiddenUris_1[_i];
            set.delete(uri);
        }
        return set;
    }, [uris, recentlyUnhiddenUris, threadgateRecord]);
}
export function useMergeThreadgateHiddenReplies() {
    var _a = useThreadgateHiddenReplyUris(), uris = _a.uris, recentlyUnhiddenUris = _a.recentlyUnhiddenUris;
    return React.useCallback(function (threadgate) {
        var set = new Set(__spreadArray(__spreadArray([], ((threadgate === null || threadgate === void 0 ? void 0 : threadgate.hiddenReplies) || []), true), uris, true));
        for (var _i = 0, recentlyUnhiddenUris_2 = recentlyUnhiddenUris; _i < recentlyUnhiddenUris_2.length; _i++) {
            var uri = recentlyUnhiddenUris_2[_i];
            set.delete(uri);
        }
        return set;
    }, [uris, recentlyUnhiddenUris]);
}
