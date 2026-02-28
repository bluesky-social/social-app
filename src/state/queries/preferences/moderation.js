import React from 'react';
import { BskyAgent, DEFAULT_LABEL_SETTINGS, interpretLabelValueDefinitions, } from '@atproto/api';
import { isNonConfigurableModerationAuthority } from '#/state/session/additional-moderation-authorities';
import { useLabelersDetailedInfoQuery } from '../labeler';
import { usePreferencesQuery } from './index';
/**
 * More strict than our default settings for logged in users.
 */
export var DEFAULT_LOGGED_OUT_LABEL_PREFERENCES = Object.fromEntries(Object.entries(DEFAULT_LABEL_SETTINGS).map(function (_a) {
    var key = _a[0], _pref = _a[1];
    return [key, 'hide'];
}));
export function useMyLabelersQuery(_a) {
    var _b;
    var _c = _a === void 0 ? {} : _a, _d = _c.excludeNonConfigurableLabelers, excludeNonConfigurableLabelers = _d === void 0 ? false : _d;
    var prefs = usePreferencesQuery();
    var dids = Array.from(new Set(BskyAgent.appLabelers.concat(((_b = prefs.data) === null || _b === void 0 ? void 0 : _b.moderationPrefs.labelers.map(function (l) { return l.did; })) || [])));
    if (excludeNonConfigurableLabelers) {
        dids = dids.filter(function (did) { return !isNonConfigurableModerationAuthority(did); });
    }
    var labelers = useLabelersDetailedInfoQuery({ dids: dids });
    var isLoading = prefs.isLoading || labelers.isLoading;
    var error = prefs.error || labelers.error;
    return React.useMemo(function () {
        return {
            isLoading: isLoading,
            error: error,
            data: labelers.data,
            refetch: labelers.refetch,
        };
    }, [labelers, isLoading, error]);
}
export function useLabelDefinitionsQuery() {
    var labelers = useMyLabelersQuery();
    return React.useMemo(function () {
        return {
            labelDefs: Object.fromEntries((labelers.data || []).map(function (labeler) { return [
                labeler.creator.did,
                interpretLabelValueDefinitions(labeler),
            ]; })),
            labelers: labelers.data || [],
        };
    }, [labelers]);
}
