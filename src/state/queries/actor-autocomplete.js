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
import React from 'react';
import { moderateProfile, } from '@atproto/api';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { isJustAMute, moduiContainsHideableOffense } from '#/lib/moderation';
import { logger } from '#/logger';
import { STALE } from '#/state/queries';
import { useAgent } from '#/state/session';
import { useModerationOpts } from '../preferences/moderation-opts';
import { DEFAULT_LOGGED_OUT_PREFERENCES } from './preferences';
var DEFAULT_MOD_OPTS = {
    userDid: undefined,
    prefs: DEFAULT_LOGGED_OUT_PREFERENCES.moderationPrefs,
};
var RQKEY_ROOT = 'actor-autocomplete';
export var RQKEY = function (prefix) { return [RQKEY_ROOT, prefix]; };
export function useActorAutocompleteQuery(prefix, maintainData, limit) {
    var moderationOpts = useModerationOpts();
    var agent = useAgent();
    prefix = prefix.toLowerCase().trim();
    if (prefix.endsWith('.')) {
        // Going from "foo" to "foo." should not clear matches.
        prefix = prefix.slice(0, -1);
    }
    return useQuery({
        staleTime: STALE.MINUTES.ONE,
        queryKey: RQKEY(prefix || ''),
        queryFn: function () {
            return __awaiter(this, void 0, void 0, function () {
                var res, _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (!prefix) return [3 /*break*/, 2];
                            return [4 /*yield*/, agent.searchActorsTypeahead({
                                    q: prefix,
                                    limit: limit || 8,
                                })];
                        case 1:
                            _a = _b.sent();
                            return [3 /*break*/, 3];
                        case 2:
                            _a = undefined;
                            _b.label = 3;
                        case 3:
                            res = _a;
                            return [2 /*return*/, (res === null || res === void 0 ? void 0 : res.data.actors) || []];
                    }
                });
            });
        },
        select: React.useCallback(function (data) {
            return computeSuggestions({
                q: prefix,
                searched: data,
                moderationOpts: moderationOpts || DEFAULT_MOD_OPTS,
            });
        }, [prefix, moderationOpts]),
        placeholderData: maintainData ? keepPreviousData : undefined,
    });
}
export function useActorAutocompleteFn() {
    var _this = this;
    var queryClient = useQueryClient();
    var moderationOpts = useModerationOpts();
    var agent = useAgent();
    return React.useCallback(function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var res, e_1;
        var query = _b.query, _c = _b.limit, limit = _c === void 0 ? 8 : _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    query = query.toLowerCase();
                    if (!query) return [3 /*break*/, 4];
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, queryClient.fetchQuery({
                            staleTime: STALE.MINUTES.ONE,
                            queryKey: RQKEY(query || ''),
                            queryFn: function () {
                                return agent.searchActorsTypeahead({
                                    q: query,
                                    limit: limit,
                                });
                            },
                        })];
                case 2:
                    res = _d.sent();
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _d.sent();
                    logger.error('useActorSearch: searchActorsTypeahead failed', {
                        message: e_1,
                    });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/, computeSuggestions({
                        q: query,
                        searched: res === null || res === void 0 ? void 0 : res.data.actors,
                        moderationOpts: moderationOpts || DEFAULT_MOD_OPTS,
                    })];
            }
        });
    }); }, [queryClient, moderationOpts, agent]);
}
function computeSuggestions(_a) {
    var q = _a.q, _b = _a.searched, searched = _b === void 0 ? [] : _b, moderationOpts = _a.moderationOpts;
    var items = [];
    var _loop_1 = function (item) {
        if (!items.find(function (item2) { return item2.handle === item.handle; })) {
            items.push(item);
        }
    };
    for (var _i = 0, searched_1 = searched; _i < searched_1.length; _i++) {
        var item = searched_1[_i];
        _loop_1(item);
    }
    return items.filter(function (profile) {
        var modui = moderateProfile(profile, moderationOpts).ui('profileList');
        var isExactMatch = q && profile.handle.toLowerCase() === q;
        return ((isExactMatch && !moduiContainsHideableOffense(modui)) ||
            !modui.filter ||
            isJustAMute(modui));
    });
}
