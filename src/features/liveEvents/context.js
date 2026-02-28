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
import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useMemo } from 'react';
import { hasMutedWord } from '@atproto/api';
import { QueryClient, useQuery } from '@tanstack/react-query';
import { useOnAppStateChange } from '#/lib/appState';
import { useIsBskyTeam } from '#/lib/hooks/useIsBskyTeam';
import { convertBskyAppUrlIfNeeded, isBskyCustomFeedUrl, makeRecordUri, } from '#/lib/strings/url-helpers';
import { usePreferencesQuery } from '#/state/queries/preferences';
import { IS_DEV, LIVE_EVENTS_URL } from '#/env';
import { useLiveEventPreferences } from '#/features/liveEvents/preferences';
import { useDevMode } from '#/storage/hooks/dev-mode';
var qc = new QueryClient();
var liveEventsQueryKey = ['live-events'];
export var DEFAULT_LIVE_EVENTS = {
    feeds: [],
};
function fetchLiveEvents() {
    return __awaiter(this, void 0, void 0, function () {
        var res, data, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch("".concat(LIVE_EVENTS_URL, "/config"))];
                case 1:
                    res = _b.sent();
                    if (!res.ok)
                        return [2 /*return*/, null];
                    return [4 /*yield*/, res.json()];
                case 2:
                    data = _b.sent();
                    return [2 /*return*/, data];
                case 3:
                    _a = _b.sent();
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    });
}
var Context = createContext(DEFAULT_LIVE_EVENTS);
export function Provider(_a) {
    var _b;
    var children = _a.children;
    var isDevMode = useDevMode()[0];
    var isBskyTeam = useIsBskyTeam();
    var preferences = usePreferencesQuery().data;
    var mutedWords = useMemo(function () { var _a, _b; return (_b = (_a = preferences === null || preferences === void 0 ? void 0 : preferences.moderationPrefs) === null || _a === void 0 ? void 0 : _a.mutedWords) !== null && _b !== void 0 ? _b : []; }, [(_b = preferences === null || preferences === void 0 ? void 0 : preferences.moderationPrefs) === null || _b === void 0 ? void 0 : _b.mutedWords]);
    var _c = useQuery({
        // keep this, prefectching handles initial load
        staleTime: 1000 * 15,
        queryKey: liveEventsQueryKey,
        refetchInterval: 1000 * 60 * 5, // refetch every 5 minutes
        queryFn: function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, fetchLiveEvents()];
                });
            });
        },
    }, qc), data = _c.data, refetch = _c.refetch;
    useOnAppStateChange(function (state) {
        if (state === 'active')
            void refetch();
    });
    var ctx = useMemo(function () {
        if (!data)
            return DEFAULT_LIVE_EVENTS;
        var skipMuteFilter = isBskyTeam || IS_DEV;
        var feeds = data.feeds.filter(function (f) {
            var _a, _b, _c, _d;
            if (f.preview && !isBskyTeam)
                return false;
            if (!skipMuteFilter && mutedWords.length > 0) {
                var text = [
                    f.title,
                    (_b = (_a = f.layouts) === null || _a === void 0 ? void 0 : _a.wide) === null || _b === void 0 ? void 0 : _b.title,
                    (_d = (_c = f.layouts) === null || _c === void 0 ? void 0 : _c.compact) === null || _d === void 0 ? void 0 : _d.title,
                ]
                    .filter(Boolean)
                    .join(' ');
                if (hasMutedWord({ mutedWords: mutedWords, text: text }))
                    return false;
            }
            return true;
        });
        return __assign(__assign({}, data), { 
            // only one at a time for now, unless bsky team and dev mode
            feeds: isBskyTeam && isDevMode ? feeds : feeds.slice(0, 1) });
    }, [data, isBskyTeam, isDevMode, mutedWords]);
    return _jsx(Context.Provider, { value: ctx, children: children });
}
export function prefetchLiveEvents() {
    return __awaiter(this, void 0, void 0, function () {
        var data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetchLiveEvents()];
                case 1:
                    data = _a.sent();
                    if (data) {
                        qc.setQueryData(liveEventsQueryKey, data);
                    }
                    return [2 /*return*/];
            }
        });
    });
}
export function useLiveEvents() {
    var ctx = useContext(Context);
    if (!ctx) {
        throw new Error('useLiveEventsContext must be used within a Provider');
    }
    return ctx;
}
export function useUserPreferencedLiveEvents() {
    var events = useLiveEvents();
    var _a = useLiveEventPreferences(), data = _a.data, isLoading = _a.isLoading;
    if (isLoading)
        return DEFAULT_LIVE_EVENTS;
    var hideAllFeeds = data.hideAllFeeds, hiddenFeedIds = data.hiddenFeedIds;
    return __assign(__assign({}, events), { feeds: hideAllFeeds
            ? []
            : events.feeds.filter(function (f) {
                var hidden = (f === null || f === void 0 ? void 0 : f.id) ? hiddenFeedIds.includes((f === null || f === void 0 ? void 0 : f.id) || '') : false;
                return !hidden;
            }) });
}
export function useActiveLiveEventFeedUris() {
    var feeds = useLiveEvents().feeds;
    return new Set(feeds
        // insurance
        .filter(function (f) { return isBskyCustomFeedUrl(f.url); })
        .map(function (f) {
        var uri = convertBskyAppUrlIfNeeded(f.url);
        var _a = uri.split('/').filter(Boolean), _0 = _a[0], did = _a[1], _1 = _a[2], rkey = _a[3];
        var urip = makeRecordUri(did, 'app.bsky.feed.generator', rkey);
        return urip.toString();
    }));
}
