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
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
import { moderateProfile, } from '@atproto/api';
import { useInfiniteQuery, useQuery, } from '@tanstack/react-query';
import { aggregateUserInterests, createBskyTopicsHeader, } from '#/lib/api/feed/utils';
import { getContentLanguages } from '#/state/preferences/languages';
import { STALE } from '#/state/queries';
import { usePreferencesQuery } from '#/state/queries/preferences';
import { useAgent, useSession } from '#/state/session';
import { useModerationOpts } from '../preferences/moderation-opts';
var suggestedFollowsQueryKeyRoot = 'suggested-follows';
var suggestedFollowsQueryKey = function (options) { return [
    suggestedFollowsQueryKeyRoot,
    options,
]; };
var suggestedFollowsByActorQueryKeyRoot = 'suggested-follows-by-actor';
var suggestedFollowsByActorQueryKey = function (did) { return [
    suggestedFollowsByActorQueryKeyRoot,
    did,
]; };
export function useSuggestedFollowsQuery(options) {
    var _this = this;
    var currentAccount = useSession().currentAccount;
    var agent = useAgent();
    var moderationOpts = useModerationOpts();
    var preferences = usePreferencesQuery().data;
    var limit = (options === null || options === void 0 ? void 0 : options.limit) || 25;
    return useInfiniteQuery({
        enabled: !!moderationOpts && !!preferences,
        staleTime: STALE.HOURS.ONE,
        queryKey: suggestedFollowsQueryKey(options),
        queryFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var contentLangs, maybeDifferentLimit, res;
            var pageParam = _b.pageParam;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        contentLangs = getContentLanguages().join(',');
                        maybeDifferentLimit = (options === null || options === void 0 ? void 0 : options.subsequentPageLimit) && pageParam
                            ? options.subsequentPageLimit
                            : limit;
                        return [4 /*yield*/, agent.app.bsky.actor.getSuggestions({
                                limit: maybeDifferentLimit,
                                cursor: pageParam,
                            }, {
                                headers: __assign(__assign({}, createBskyTopicsHeader(aggregateUserInterests(preferences))), { 'Accept-Language': contentLangs }),
                            })];
                    case 1:
                        res = _c.sent();
                        res.data.actors = res.data.actors
                            .filter(function (actor) {
                            return !moderateProfile(actor, moderationOpts).ui('profileList').filter;
                        })
                            .filter(function (actor) {
                            var viewer = actor.viewer;
                            if (viewer) {
                                if (viewer.following ||
                                    viewer.muted ||
                                    viewer.mutedByList ||
                                    viewer.blockedBy ||
                                    viewer.blocking) {
                                    return false;
                                }
                            }
                            if (actor.did === (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did)) {
                                return false;
                            }
                            return true;
                        });
                        return [2 /*return*/, res.data];
                }
            });
        }); },
        initialPageParam: undefined,
        getNextPageParam: function (lastPage) { return lastPage.cursor; },
    });
}
export function useSuggestedFollowsByActorQuery(_a) {
    var _this = this;
    var did = _a.did, enabled = _a.enabled, _b = _a.staleTime, staleTime = _b === void 0 ? STALE.MINUTES.FIVE : _b;
    var agent = useAgent();
    return useQuery({
        staleTime: staleTime,
        queryKey: suggestedFollowsByActorQueryKey(did),
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var res, suggestions;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, agent.app.bsky.graph.getSuggestedFollowsByActor({
                            actor: did,
                        })];
                    case 1:
                        res = _a.sent();
                        suggestions = res.data.isFallback
                            ? []
                            : res.data.suggestions.filter(function (profile) { var _a; return !((_a = profile.viewer) === null || _a === void 0 ? void 0 : _a.following); });
                        return [2 /*return*/, { suggestions: suggestions, recId: res.data.recId }];
                }
            });
        }); },
        enabled: enabled,
    });
}
export function findAllProfilesInQueryData(queryClient, did) {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [5 /*yield**/, __values(findAllProfilesInSuggestedFollowsQueryData(queryClient, did))];
            case 1:
                _a.sent();
                return [5 /*yield**/, __values(findAllProfilesInSuggestedFollowsByActorQueryData(queryClient, did))];
            case 2:
                _a.sent();
                return [2 /*return*/];
        }
    });
}
function findAllProfilesInSuggestedFollowsQueryData(queryClient, did) {
    var queryDatas, _i, queryDatas_1, _a, _queryKey, queryData, _b, _c, page, _d, _e, actor;
    return __generator(this, function (_f) {
        switch (_f.label) {
            case 0:
                queryDatas = queryClient.getQueriesData({
                    queryKey: [suggestedFollowsQueryKeyRoot],
                });
                _i = 0, queryDatas_1 = queryDatas;
                _f.label = 1;
            case 1:
                if (!(_i < queryDatas_1.length)) return [3 /*break*/, 8];
                _a = queryDatas_1[_i], _queryKey = _a[0], queryData = _a[1];
                if (!(queryData === null || queryData === void 0 ? void 0 : queryData.pages)) {
                    return [3 /*break*/, 7];
                }
                _b = 0, _c = queryData === null || queryData === void 0 ? void 0 : queryData.pages;
                _f.label = 2;
            case 2:
                if (!(_b < _c.length)) return [3 /*break*/, 7];
                page = _c[_b];
                _d = 0, _e = page.actors;
                _f.label = 3;
            case 3:
                if (!(_d < _e.length)) return [3 /*break*/, 6];
                actor = _e[_d];
                if (!(actor.did === did)) return [3 /*break*/, 5];
                return [4 /*yield*/, actor];
            case 4:
                _f.sent();
                _f.label = 5;
            case 5:
                _d++;
                return [3 /*break*/, 3];
            case 6:
                _b++;
                return [3 /*break*/, 2];
            case 7:
                _i++;
                return [3 /*break*/, 1];
            case 8: return [2 /*return*/];
        }
    });
}
function findAllProfilesInSuggestedFollowsByActorQueryData(queryClient, did) {
    var queryDatas, _i, queryDatas_2, _a, _queryKey, queryData, _b, _c, suggestion;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                queryDatas = queryClient.getQueriesData({
                    queryKey: [suggestedFollowsByActorQueryKeyRoot],
                });
                _i = 0, queryDatas_2 = queryDatas;
                _d.label = 1;
            case 1:
                if (!(_i < queryDatas_2.length)) return [3 /*break*/, 6];
                _a = queryDatas_2[_i], _queryKey = _a[0], queryData = _a[1];
                if (!queryData) {
                    return [3 /*break*/, 5];
                }
                _b = 0, _c = queryData.suggestions;
                _d.label = 2;
            case 2:
                if (!(_b < _c.length)) return [3 /*break*/, 5];
                suggestion = _c[_b];
                if (!(suggestion.did === did)) return [3 /*break*/, 4];
                return [4 /*yield*/, suggestion];
            case 3:
                _d.sent();
                _d.label = 4;
            case 4:
                _b++;
                return [3 /*break*/, 2];
            case 5:
                _i++;
                return [3 /*break*/, 1];
            case 6: return [2 /*return*/];
        }
    });
}
