import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, } from 'react';
import { logger } from '#/logger';
import { STALE } from '#/state/queries';
import { Nux, useNuxs, useResetNuxs, useSaveNux } from '#/state/queries/nuxs';
import { usePreferencesQuery, } from '#/state/queries/preferences';
import { useProfileQuery } from '#/state/queries/profile';
import { useSession } from '#/state/session';
import { useOnboardingState } from '#/state/shell';
import { DraftsAnnouncement, enabled as isDraftsAnnouncementEnabled, } from '#/components/dialogs/nuxs/DraftsAnnouncement';
import { isSnoozed, snooze, unsnooze } from '#/components/dialogs/nuxs/snoozing';
import { useAnalytics } from '#/analytics';
import { useGeolocation } from '#/geolocation';
var queuedNuxs = [
    {
        id: Nux.DraftsAnnouncement,
        enabled: isDraftsAnnouncementEnabled,
    },
];
var Context = createContext({
    activeNux: undefined,
    dismissActiveNux: function () { },
});
Context.displayName = 'NuxDialogContext';
export function useNuxDialogContext() {
    return useContext(Context);
}
export function NuxDialogs() {
    var currentAccount = useSession().currentAccount;
    var preferences = usePreferencesQuery().data;
    var profile = useProfileQuery({
        did: currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did,
        staleTime: STALE.INFINITY, // createdAt isn't gonna change
    }).data;
    var onboardingActive = useOnboardingState().isActive;
    var isLoading = onboardingActive ||
        !currentAccount ||
        !preferences ||
        !profile ||
        // Profile isn't legit ready until createdAt is a real date.
        !profile.createdAt ||
        profile.createdAt === '0001-01-01T00:00:00.000Z'; // TODO: Fix this in AppView.
    return !isLoading ? (_jsx(Inner, { currentAccount: currentAccount, currentProfile: profile, preferences: preferences })) : null;
}
function Inner(_a) {
    var currentAccount = _a.currentAccount, currentProfile = _a.currentProfile, preferences = _a.preferences;
    var ax = useAnalytics();
    var geolocation = useGeolocation();
    var nuxs = useNuxs().nuxs;
    var _b = useState(function () {
        return isSnoozed();
    }), snoozed = _b[0], setSnoozed = _b[1];
    var _c = useState(), activeNux = _c[0], setActiveNux = _c[1];
    var saveNux = useSaveNux().mutateAsync;
    var resetNuxs = useResetNuxs().mutate;
    var snoozeNuxDialog = useCallback(function () {
        snooze();
        setSnoozed(true);
    }, [setSnoozed]);
    var dismissActiveNux = useCallback(function () {
        if (!activeNux)
            return;
        setActiveNux(undefined);
    }, [activeNux, setActiveNux]);
    if (__DEV__ && typeof window !== 'undefined') {
        // @ts-ignore
        window.clearNuxDialog = function (id) {
            if (!__DEV__ || !id)
                return;
            resetNuxs([id]);
            unsnooze();
        };
    }
    useEffect(function () {
        if (snoozed)
            return; // comment this out to test
        if (!nuxs)
            return;
        var _loop_1 = function (id, enabled) {
            var nux = nuxs.find(function (nux) { return nux.id === id; });
            // check if completed first
            if (nux && nux.completed) {
                return "continue";
            }
            // then check gate (track exposure)
            if (enabled &&
                !enabled({
                    features: ax.features,
                    currentAccount: currentAccount,
                    currentProfile: currentProfile,
                    preferences: preferences,
                    geolocation: geolocation,
                })) {
                return "continue";
            }
            logger.debug("NUX dialogs: activating '".concat(id, "' NUX"));
            // we have a winner
            setActiveNux(id);
            // immediately snooze for a day
            snoozeNuxDialog();
            // immediately update remote data (affects next reload)
            saveNux({
                id: id,
                completed: true,
                data: undefined,
            }).catch(function (e) {
                logger.error("NUX dialogs: failed to upsert '".concat(id, "' NUX"), {
                    safeMessage: e.message,
                });
            });
            return "break";
        };
        for (var _i = 0, queuedNuxs_1 = queuedNuxs; _i < queuedNuxs_1.length; _i++) {
            var _a = queuedNuxs_1[_i], id = _a.id, enabled = _a.enabled;
            var state_1 = _loop_1(id, enabled);
            if (state_1 === "break")
                break;
        }
    }, [
        ax.features,
        nuxs,
        snoozed,
        snoozeNuxDialog,
        saveNux,
        currentAccount,
        currentProfile,
        preferences,
        geolocation,
    ]);
    var ctx = useMemo(function () {
        return {
            activeNux: activeNux,
            dismissActiveNux: dismissActiveNux,
        };
    }, [activeNux, dismissActiveNux]);
    return (_jsx(Context.Provider, { value: ctx, children: activeNux === Nux.DraftsAnnouncement && _jsx(DraftsAnnouncement, {}) }));
}
