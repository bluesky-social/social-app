var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { useCallback, useMemo, useRef, useState } from 'react';
import debounce from 'lodash.debounce';
import { useCallOnce } from '#/lib/once';
import { usePreferencesQuery, useSetThreadViewPreferencesMutation, } from '#/state/queries/preferences';
import { useAnalytics } from '#/analytics';
export function useThreadPreferences(_a) {
    var _this = this;
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
    var _f = useState(false), isSaving = _f[0], setIsSaving = _f[1];
    var mutateAsync = useSetThreadViewPreferencesMutation().mutateAsync;
    var savePrefs = useMemo(function () {
        return debounce(function (prefs) { return __awaiter(_this, void 0, void 0, function () {
            var e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, 3, 4]);
                        setIsSaving(true);
                        return [4 /*yield*/, mutateAsync(prefs)];
                    case 1:
                        _a.sent();
                        ax.metric('thread:preferences:update', {
                            sort: prefs.sort,
                            view: prefs.lab_treeViewEnabled ? 'tree' : 'linear',
                        });
                        return [3 /*break*/, 4];
                    case 2:
                        e_1 = _a.sent();
                        ax.logger.error('useThreadPreferences failed to save', {
                            safeMessage: e_1,
                        });
                        return [3 /*break*/, 4];
                    case 3:
                        setIsSaving(false);
                        return [7 /*endfinally*/];
                    case 4: return [2 /*return*/];
                }
            });
        }); }, 4e3);
    }, [mutateAsync]);
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
