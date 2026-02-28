var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { useQueryClient } from '@tanstack/react-query';
import { useNonReactiveCallback } from '#/lib/hooks/useNonReactiveCallback';
import { postUriToRelativePath, toBskyAppUrl } from '#/lib/strings/url-helpers';
import { purgeTemporaryImageFiles } from '#/state/gallery';
import { precacheResolveLinkQuery, RQKEY_GIF_ROOT, RQKEY_LINK_ROOT, } from '#/state/queries/resolve-link';
import * as Toast from '#/view/com/util/Toast';
var stateContext = React.createContext(undefined);
stateContext.displayName = 'ComposerStateContext';
var controlsContext = React.createContext({
    openComposer: function (_opts) { },
    closeComposer: function () {
        return false;
    },
});
controlsContext.displayName = 'ComposerControlsContext';
export function Provider(_a) {
    var children = _a.children;
    var _ = useLingui()._;
    var _b = React.useState(), state = _b[0], setState = _b[1];
    var queryClient = useQueryClient();
    var openComposer = useNonReactiveCallback(function (opts) {
        var _a, _b, _c, _d, _e;
        if (opts.quote) {
            var path = postUriToRelativePath(opts.quote.uri);
            if (path) {
                var appUrl = toBskyAppUrl(path);
                precacheResolveLinkQuery(queryClient, appUrl, {
                    type: 'record',
                    kind: 'post',
                    record: {
                        cid: opts.quote.cid,
                        uri: opts.quote.uri,
                    },
                    view: opts.quote,
                });
            }
        }
        var author = ((_a = opts.replyTo) === null || _a === void 0 ? void 0 : _a.author) || ((_b = opts.quote) === null || _b === void 0 ? void 0 : _b.author);
        var isBlocked = Boolean(author &&
            (((_c = author.viewer) === null || _c === void 0 ? void 0 : _c.blocking) ||
                ((_d = author.viewer) === null || _d === void 0 ? void 0 : _d.blockedBy) ||
                ((_e = author.viewer) === null || _e === void 0 ? void 0 : _e.blockingByList)));
        if (isBlocked) {
            Toast.show(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Cannot interact with a blocked user"], ["Cannot interact with a blocked user"])))), 'exclamation-circle');
        }
        else {
            setState(function (prevOpts) {
                if (prevOpts) {
                    // Never replace an already open composer.
                    return prevOpts;
                }
                return opts;
            });
        }
    });
    var closeComposer = useNonReactiveCallback(function () {
        var wasOpen = !!state;
        if (wasOpen) {
            setState(undefined);
            purgeTemporaryImageFiles();
            // Purging deletes cached thumbnails on disk, so remove the query
            // caches that may hold references to those now-deleted file paths.
            // Without this, restoring a draft would serve stale ResolvedLink
            // data pointing at missing files, causing "Failed to load blob".
            queryClient.removeQueries({ queryKey: [RQKEY_LINK_ROOT] });
            queryClient.removeQueries({ queryKey: [RQKEY_GIF_ROOT] });
        }
        return wasOpen;
    });
    var api = React.useMemo(function () { return ({
        openComposer: openComposer,
        closeComposer: closeComposer,
    }); }, [openComposer, closeComposer]);
    return (_jsx(stateContext.Provider, { value: state, children: _jsx(controlsContext.Provider, { value: api, children: children }) }));
}
export function useComposerState() {
    return React.useContext(stateContext);
}
export function useComposerControls() {
    var closeComposer = React.useContext(controlsContext).closeComposer;
    return React.useMemo(function () { return ({ closeComposer: closeComposer }); }, [closeComposer]);
}
/**
 * DO NOT USE DIRECTLY. The deprecation notice as a warning only, it's not
 * actually deprecated.
 *
 * @deprecated use `#/lib/hooks/useOpenComposer` instead
 */
export function useOpenComposer() {
    var openComposer = React.useContext(controlsContext).openComposer;
    return React.useMemo(function () { return ({ openComposer: openComposer }); }, [openComposer]);
}
var templateObject_1;
