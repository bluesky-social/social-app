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
import { createContext, useContext, useMemo } from 'react';
import { BskyAgent } from '@atproto/api';
import { useHiddenPosts, useLabelDefinitions } from '#/state/preferences';
import { DEFAULT_LOGGED_OUT_LABEL_PREFERENCES } from '#/state/queries/preferences/moderation';
import { useSession } from '#/state/session';
import { usePreferencesQuery } from '../queries/preferences';
export var moderationOptsContext = createContext(undefined);
moderationOptsContext.displayName = 'ModerationOptsContext';
// used in the moderation state devtool
export var moderationOptsOverrideContext = createContext(undefined);
moderationOptsOverrideContext.displayName = 'ModerationOptsOverrideContext';
export function useModerationOpts() {
    return useContext(moderationOptsContext);
}
export function Provider(_a) {
    var _b;
    var children = _a.children;
    var override = useContext(moderationOptsOverrideContext);
    var currentAccount = useSession().currentAccount;
    var prefs = usePreferencesQuery();
    var labelDefs = useLabelDefinitions().labelDefs;
    var hiddenPosts = useHiddenPosts(); // TODO move this into pds-stored prefs
    var userDid = currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did;
    var moderationPrefs = (_b = prefs.data) === null || _b === void 0 ? void 0 : _b.moderationPrefs;
    var value = useMemo(function () {
        if (override) {
            return override;
        }
        if (!moderationPrefs) {
            return undefined;
        }
        return {
            userDid: userDid,
            prefs: __assign(__assign({}, moderationPrefs), { labelers: moderationPrefs.labelers.length
                    ? moderationPrefs.labelers
                    : BskyAgent.appLabelers.map(function (did) { return ({
                        did: did,
                        labels: DEFAULT_LOGGED_OUT_LABEL_PREFERENCES,
                    }); }), hiddenPosts: hiddenPosts || [] }),
            labelDefs: labelDefs,
        };
    }, [override, userDid, labelDefs, moderationPrefs, hiddenPosts]);
    return (_jsx(moderationOptsContext.Provider, { value: value, children: children }));
}
