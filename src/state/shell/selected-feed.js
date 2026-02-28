import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useState } from 'react';
import { useSession } from '#/state/session';
import { IS_WEB } from '#/env';
import { account } from '#/storage';
var stateContext = createContext(null);
stateContext.displayName = 'SelectedFeedStateContext';
var setContext = createContext(function (_) { });
setContext.displayName = 'SelectedFeedSetContext';
function getInitialFeed(did) {
    if (IS_WEB) {
        if (window.location.pathname === '/') {
            var params = new URLSearchParams(window.location.search);
            var feedFromUrl = params.get('feed');
            if (feedFromUrl) {
                // If explicitly booted from a link like /?feed=..., prefer that.
                return feedFromUrl;
            }
        }
        var feedFromSession = sessionStorage.getItem('lastSelectedHomeFeed');
        if (feedFromSession) {
            // Fall back to a previously chosen feed for this browser tab.
            return feedFromSession;
        }
    }
    if (did) {
        var feedFromStorage = account.get([did, 'lastSelectedHomeFeed']);
        if (feedFromStorage) {
            // Fall back to the last chosen one across all tabs.
            return feedFromStorage;
        }
    }
    return null;
}
export function Provider(_a) {
    var children = _a.children;
    var currentAccount = useSession().currentAccount;
    var _b = useState(function () { return getInitialFeed(currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did); }), state = _b[0], setState = _b[1];
    var saveState = useCallback(function (feed) {
        setState(feed);
        if (IS_WEB) {
            try {
                sessionStorage.setItem('lastSelectedHomeFeed', feed);
            }
            catch (_a) { }
        }
        if (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did) {
            account.set([currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did, 'lastSelectedHomeFeed'], feed);
        }
    }, [currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did]);
    return (_jsx(stateContext.Provider, { value: state, children: _jsx(setContext.Provider, { value: saveState, children: children }) }));
}
export function useSelectedFeed() {
    return useContext(stateContext);
}
export function useSetSelectedFeed() {
    return useContext(setContext);
}
