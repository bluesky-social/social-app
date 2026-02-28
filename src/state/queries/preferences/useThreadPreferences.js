import { useCallback, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import debounce from 'lodash.debounce';
import { useCallOnce } from '#/lib/once';
import { usePreferencesQuery, useSetThreadViewPreferencesMutation, } from '#/state/queries/preferences';
import { useAnalytics } from '#/analytics';
export function useThreadPreferences(_a) {
    var _b = _a === void 0 ? {} : _a, save = _b.save;
    var ax = useAnalytics();
    var preferences = usePreferencesQuery().data;
    var serverPrefs = preferences === null || preferences === void 0 ? void 0 : preferences.threadViewPrefs;
    var once = useCallOnce();
    /*
     * Create local state representations of server state
     */
    var _c = useState(normalizeSort((serverPrefs === null || serverPrefs === void 0 ? void 0 : serverPrefs.sort) || 'top')), sort = _c[0], setSort = _c[1];
    var _d = useState(normalizeView({
        treeViewEnabled: !!(serverPrefs === null || serverPrefs === void 0 ? void 0 : serverPrefs.lab_treeViewEnabled),
    })), view = _d[0], setView = _d[1];
    /**
     * If we get a server update, update local state
     */
    var _e = useState(serverPrefs), prevServerPrefs = _e[0], setPrevServerPrefs = _e[1];
    var isLoaded = !!prevServerPrefs;
    if (serverPrefs && prevServerPrefs !== serverPrefs) {
        setPrevServerPrefs(serverPrefs);
        /*
         * Update
         */
        setSort(normalizeSort(serverPrefs.sort));
        setView(normalizeView({
            treeViewEnabled: !!serverPrefs.lab_treeViewEnabled,
        }));
        once(function () {
            ax.metric('thread:preferences:load', {
                sort: serverPrefs.sort,
                view: serverPrefs.lab_treeViewEnabled ? 'tree' : 'linear',
            });
        });
    }
    var userUpdatedPrefs = useRef(false);
    var _f = useSetThreadViewPreferencesMutation({
        onSuccess: function (_data, prefs) {
            ax.metric('thread:preferences:update', {
                sort: prefs.sort,
                view: prefs.lab_treeViewEnabled ? 'tree' : 'linear',
            });
        },
        onError: function (err) {
            ax.logger.error('useThreadPreferences failed to save', {
                safeMessage: err,
            });
        },
    }), mutate = _f.mutate, isSaving = _f.isPending;
    var savePrefs = useMemo(function () {
        return debounce(function (prefs) {
            mutate(prefs);
        }, 2e3, { leading: true, trailing: true });
    }, [mutate]);
    // flush on leave screen
    useFocusEffect(useCallback(function () {
        return function () {
            void savePrefs.flush();
        };
    }, [savePrefs]));
    if (save && userUpdatedPrefs.current) {
        savePrefs({
            sort: sort,
            lab_treeViewEnabled: view === 'tree',
        });
        userUpdatedPrefs.current = false;
    }
    var setSortWrapped = useCallback(function (next) {
        userUpdatedPrefs.current = true;
        setSort(normalizeSort(next));
    }, [setSort]);
    var setViewWrapped = useCallback(function (next) {
        userUpdatedPrefs.current = true;
        setView(next);
    }, [setView]);
    return useMemo(function () { return ({
        isLoaded: isLoaded,
        isSaving: isSaving,
        sort: sort,
        setSort: setSortWrapped,
        view: view,
        setView: setViewWrapped,
    }); }, [isLoaded, isSaving, sort, setSortWrapped, view, setViewWrapped]);
}
/**
 * Migrates user thread preferences from the old sort values to V2
 */
export function normalizeSort(sort) {
    switch (sort) {
        case 'oldest':
            return 'oldest';
        case 'newest':
            return 'newest';
        default:
            return 'top';
    }
}
/**
 * Transforms existing treeViewEnabled preference into a ThreadViewOption
 */
export function normalizeView(_a) {
    var treeViewEnabled = _a.treeViewEnabled;
    return treeViewEnabled ? 'tree' : 'linear';
}
