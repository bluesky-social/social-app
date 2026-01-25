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
import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PROD_DEFAULT_FEED } from '#/lib/constants';
import { replaceEqualDeep } from '#/lib/functions';
import { getAge } from '#/lib/strings/time';
import { STALE } from '#/state/queries';
import { DEFAULT_HOME_FEED_PREFS, DEFAULT_LOGGED_OUT_PREFERENCES, DEFAULT_THREAD_VIEW_PREFS, } from '#/state/queries/preferences/const';
import { useAgent } from '#/state/session';
import { saveLabelers } from '#/state/session/agent-config';
import { useAgeAssurance } from '#/ageAssurance';
import { makeAgeRestrictedModerationPrefs } from '#/ageAssurance/util';
import { useAnalytics } from '#/analytics';
export * from '#/state/queries/preferences/const';
export * from '#/state/queries/preferences/moderation';
export * from '#/state/queries/preferences/types';
var preferencesQueryKeyRoot = 'getPreferences';
export var preferencesQueryKey = [preferencesQueryKeyRoot];
export function usePreferencesQuery() {
    var _this = this;
    var agent = useAgent();
    var aa = useAgeAssurance();
    return useQuery({
        staleTime: STALE.SECONDS.FIFTEEN,
        structuralSharing: replaceEqualDeep,
        refetchOnWindowFocus: true,
        queryKey: preferencesQueryKey,
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var res, preferences;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!!agent.did) return [3 /*break*/, 1];
                        return [2 /*return*/, DEFAULT_LOGGED_OUT_PREFERENCES];
                    case 1: return [4 /*yield*/, agent.getPreferences()
                        // save to local storage to ensure there are labels on initial requests
                    ];
                    case 2:
                        res = _b.sent();
                        // save to local storage to ensure there are labels on initial requests
                        saveLabelers(agent.did, res.moderationPrefs.labelers.map(function (l) { return l.did; }));
                        preferences = __assign(__assign({}, res), { savedFeeds: res.savedFeeds.filter(function (f) { return f.type !== 'unknown'; }), 
                            /**
                             * Special preference, only used for following feed, previously
                             * called `home`
                             */
                            feedViewPrefs: __assign(__assign({}, DEFAULT_HOME_FEED_PREFS), (res.feedViewPrefs.home || {})), threadViewPrefs: __assign(__assign({}, DEFAULT_THREAD_VIEW_PREFS), ((_a = res.threadViewPrefs) !== null && _a !== void 0 ? _a : {})), userAge: res.birthDate ? getAge(res.birthDate) : undefined });
                        return [2 /*return*/, preferences];
                }
            });
        }); },
        select: useCallback(function (data) {
            /**
             * Prefs are all downstream of age assurance now. For logged-out
             * users, we override moderation prefs based on AA state.
             */
            if (aa.state.access !== aa.Access.Full) {
                data = __assign(__assign({}, data), { moderationPrefs: makeAgeRestrictedModerationPrefs(data.moderationPrefs) });
            }
            return data;
        }, [aa]),
    });
}
export function useClearPreferencesMutation() {
    var _this = this;
    var queryClient = useQueryClient();
    var agent = useAgent();
    return useMutation({
        mutationFn: function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, agent.app.bsky.actor.putPreferences({ preferences: [] })
                        // triggers a refetch
                    ];
                    case 1:
                        _a.sent();
                        // triggers a refetch
                        return [4 /*yield*/, queryClient.invalidateQueries({
                                queryKey: preferencesQueryKey,
                            })];
                    case 2:
                        // triggers a refetch
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); },
    });
}
export function usePreferencesSetContentLabelMutation() {
    var _this = this;
    var ax = useAnalytics();
    var agent = useAgent();
    var queryClient = useQueryClient();
    return useMutation({
        mutationFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var label = _b.label, visibility = _b.visibility, labelerDid = _b.labelerDid;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, agent.setContentLabelPref(label, visibility, labelerDid)];
                    case 1:
                        _c.sent();
                        ax.metric('moderation:changeLabelPreference', { preference: visibility });
                        // triggers a refetch
                        return [4 /*yield*/, queryClient.invalidateQueries({
                                queryKey: preferencesQueryKey,
                            })];
                    case 2:
                        // triggers a refetch
                        _c.sent();
                        return [2 /*return*/];
                }
            });
        }); },
    });
}
export function useSetContentLabelMutation() {
    var _this = this;
    var queryClient = useQueryClient();
    var agent = useAgent();
    return useMutation({
        mutationFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var label = _b.label, visibility = _b.visibility, labelerDid = _b.labelerDid;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, agent.setContentLabelPref(label, visibility, labelerDid)
                        // triggers a refetch
                    ];
                    case 1:
                        _c.sent();
                        // triggers a refetch
                        return [4 /*yield*/, queryClient.invalidateQueries({
                                queryKey: preferencesQueryKey,
                            })];
                    case 2:
                        // triggers a refetch
                        _c.sent();
                        return [2 /*return*/];
                }
            });
        }); },
    });
}
export function usePreferencesSetAdultContentMutation() {
    var _this = this;
    var queryClient = useQueryClient();
    var agent = useAgent();
    return useMutation({
        mutationFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var enabled = _b.enabled;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, agent.setAdultContentEnabled(enabled)
                        // triggers a refetch
                    ];
                    case 1:
                        _c.sent();
                        // triggers a refetch
                        return [4 /*yield*/, queryClient.invalidateQueries({
                                queryKey: preferencesQueryKey,
                            })];
                    case 2:
                        // triggers a refetch
                        _c.sent();
                        return [2 /*return*/];
                }
            });
        }); },
    });
}
export function useSetFeedViewPreferencesMutation() {
    var _this = this;
    var queryClient = useQueryClient();
    var agent = useAgent();
    return useMutation({
        mutationFn: function (prefs) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    /*
                     * special handling here, merged into `feedViewPrefs` above, since
                     * following was previously called `home`
                     */
                    return [4 /*yield*/, agent.setFeedViewPrefs('home', prefs)
                        // triggers a refetch
                    ];
                    case 1:
                        /*
                         * special handling here, merged into `feedViewPrefs` above, since
                         * following was previously called `home`
                         */
                        _a.sent();
                        // triggers a refetch
                        return [4 /*yield*/, queryClient.invalidateQueries({
                                queryKey: preferencesQueryKey,
                            })];
                    case 2:
                        // triggers a refetch
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); },
    });
}
export function useSetThreadViewPreferencesMutation() {
    var _this = this;
    var queryClient = useQueryClient();
    var agent = useAgent();
    return useMutation({
        mutationFn: function (prefs) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, agent.setThreadViewPrefs(prefs)
                        // triggers a refetch
                    ];
                    case 1:
                        _a.sent();
                        // triggers a refetch
                        return [4 /*yield*/, queryClient.invalidateQueries({
                                queryKey: preferencesQueryKey,
                            })];
                    case 2:
                        // triggers a refetch
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); },
    });
}
export function useOverwriteSavedFeedsMutation() {
    var _this = this;
    var queryClient = useQueryClient();
    var agent = useAgent();
    return useMutation({
        mutationFn: function (savedFeeds) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, agent.overwriteSavedFeeds(savedFeeds)
                        // triggers a refetch
                    ];
                    case 1:
                        _a.sent();
                        // triggers a refetch
                        return [4 /*yield*/, queryClient.invalidateQueries({
                                queryKey: preferencesQueryKey,
                            })];
                    case 2:
                        // triggers a refetch
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); },
    });
}
export function useAddSavedFeedsMutation() {
    var _this = this;
    var queryClient = useQueryClient();
    var agent = useAgent();
    return useMutation({
        mutationFn: function (savedFeeds) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, agent.addSavedFeeds(savedFeeds)
                        // triggers a refetch
                    ];
                    case 1:
                        _a.sent();
                        // triggers a refetch
                        return [4 /*yield*/, queryClient.invalidateQueries({
                                queryKey: preferencesQueryKey,
                            })];
                    case 2:
                        // triggers a refetch
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); },
    });
}
export function useRemoveFeedMutation() {
    var _this = this;
    var queryClient = useQueryClient();
    var agent = useAgent();
    return useMutation({
        mutationFn: function (savedFeed) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, agent.removeSavedFeeds([savedFeed.id])
                        // triggers a refetch
                    ];
                    case 1:
                        _a.sent();
                        // triggers a refetch
                        return [4 /*yield*/, queryClient.invalidateQueries({
                                queryKey: preferencesQueryKey,
                            })];
                    case 2:
                        // triggers a refetch
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); },
    });
}
export function useReplaceForYouWithDiscoverFeedMutation() {
    var _this = this;
    var queryClient = useQueryClient();
    var agent = useAgent();
    return useMutation({
        mutationFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var forYouFeedConfig = _b.forYouFeedConfig, discoverFeedConfig = _b.discoverFeedConfig;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!forYouFeedConfig) return [3 /*break*/, 2];
                        return [4 /*yield*/, agent.removeSavedFeeds([forYouFeedConfig.id])];
                    case 1:
                        _c.sent();
                        _c.label = 2;
                    case 2:
                        if (!!discoverFeedConfig) return [3 /*break*/, 4];
                        return [4 /*yield*/, agent.addSavedFeeds([
                                {
                                    type: 'feed',
                                    value: PROD_DEFAULT_FEED('whats-hot'),
                                    pinned: true,
                                },
                            ])];
                    case 3:
                        _c.sent();
                        return [3 /*break*/, 6];
                    case 4: return [4 /*yield*/, agent.updateSavedFeeds([
                            __assign(__assign({}, discoverFeedConfig), { pinned: true }),
                        ])];
                    case 5:
                        _c.sent();
                        _c.label = 6;
                    case 6: 
                    // triggers a refetch
                    return [4 /*yield*/, queryClient.invalidateQueries({
                            queryKey: preferencesQueryKey,
                        })];
                    case 7:
                        // triggers a refetch
                        _c.sent();
                        return [2 /*return*/];
                }
            });
        }); },
    });
}
export function useUpdateSavedFeedsMutation() {
    var _this = this;
    var queryClient = useQueryClient();
    var agent = useAgent();
    return useMutation({
        mutationFn: function (feeds) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, agent.updateSavedFeeds(feeds)
                        // triggers a refetch
                    ];
                    case 1:
                        _a.sent();
                        // triggers a refetch
                        return [4 /*yield*/, queryClient.invalidateQueries({
                                queryKey: preferencesQueryKey,
                            })];
                    case 2:
                        // triggers a refetch
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); },
    });
}
export function useUpsertMutedWordsMutation() {
    var _this = this;
    var queryClient = useQueryClient();
    var agent = useAgent();
    return useMutation({
        mutationFn: function (mutedWords) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, agent.upsertMutedWords(mutedWords)
                        // triggers a refetch
                    ];
                    case 1:
                        _a.sent();
                        // triggers a refetch
                        return [4 /*yield*/, queryClient.invalidateQueries({
                                queryKey: preferencesQueryKey,
                            })];
                    case 2:
                        // triggers a refetch
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); },
    });
}
export function useUpdateMutedWordMutation() {
    var _this = this;
    var queryClient = useQueryClient();
    var agent = useAgent();
    return useMutation({
        mutationFn: function (mutedWord) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, agent.updateMutedWord(mutedWord)
                        // triggers a refetch
                    ];
                    case 1:
                        _a.sent();
                        // triggers a refetch
                        return [4 /*yield*/, queryClient.invalidateQueries({
                                queryKey: preferencesQueryKey,
                            })];
                    case 2:
                        // triggers a refetch
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); },
    });
}
export function useRemoveMutedWordMutation() {
    var _this = this;
    var queryClient = useQueryClient();
    var agent = useAgent();
    return useMutation({
        mutationFn: function (mutedWord) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, agent.removeMutedWord(mutedWord)
                        // triggers a refetch
                    ];
                    case 1:
                        _a.sent();
                        // triggers a refetch
                        return [4 /*yield*/, queryClient.invalidateQueries({
                                queryKey: preferencesQueryKey,
                            })];
                    case 2:
                        // triggers a refetch
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); },
    });
}
export function useRemoveMutedWordsMutation() {
    var _this = this;
    var queryClient = useQueryClient();
    var agent = useAgent();
    return useMutation({
        mutationFn: function (mutedWords) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, agent.removeMutedWords(mutedWords)
                        // triggers a refetch
                    ];
                    case 1:
                        _a.sent();
                        // triggers a refetch
                        return [4 /*yield*/, queryClient.invalidateQueries({
                                queryKey: preferencesQueryKey,
                            })];
                    case 2:
                        // triggers a refetch
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); },
    });
}
export function useQueueNudgesMutation() {
    var _this = this;
    var queryClient = useQueryClient();
    var agent = useAgent();
    return useMutation({
        mutationFn: function (nudges) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, agent.bskyAppQueueNudges(nudges)
                        // triggers a refetch
                    ];
                    case 1:
                        _a.sent();
                        // triggers a refetch
                        return [4 /*yield*/, queryClient.invalidateQueries({
                                queryKey: preferencesQueryKey,
                            })];
                    case 2:
                        // triggers a refetch
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); },
    });
}
export function useDismissNudgesMutation() {
    var _this = this;
    var queryClient = useQueryClient();
    var agent = useAgent();
    return useMutation({
        mutationFn: function (nudges) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, agent.bskyAppDismissNudges(nudges)
                        // triggers a refetch
                    ];
                    case 1:
                        _a.sent();
                        // triggers a refetch
                        return [4 /*yield*/, queryClient.invalidateQueries({
                                queryKey: preferencesQueryKey,
                            })];
                    case 2:
                        // triggers a refetch
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); },
    });
}
export function useSetActiveProgressGuideMutation() {
    var _this = this;
    var queryClient = useQueryClient();
    var agent = useAgent();
    return useMutation({
        mutationFn: function (guide) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, agent.bskyAppSetActiveProgressGuide(guide)
                        // triggers a refetch
                    ];
                    case 1:
                        _a.sent();
                        // triggers a refetch
                        return [4 /*yield*/, queryClient.invalidateQueries({
                                queryKey: preferencesQueryKey,
                            })];
                    case 2:
                        // triggers a refetch
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); },
    });
}
export function useSetVerificationPrefsMutation() {
    var _this = this;
    var ax = useAnalytics();
    var queryClient = useQueryClient();
    var agent = useAgent();
    return useMutation({
        mutationFn: function (prefs) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, agent.setVerificationPrefs(prefs)];
                    case 1:
                        _a.sent();
                        if (prefs.hideBadges) {
                            ax.metric('verification:settings:hideBadges', {});
                        }
                        else {
                            ax.metric('verification:settings:unHideBadges', {});
                        }
                        // triggers a refetch
                        return [4 /*yield*/, queryClient.invalidateQueries({
                                queryKey: preferencesQueryKey,
                            })];
                    case 2:
                        // triggers a refetch
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); },
    });
}
