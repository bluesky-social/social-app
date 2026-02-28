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
import { useEffect } from 'react';
import { AppBskyActorDefs, asPredicate } from '@atproto/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { preferencesQueryKey, usePreferencesQuery, } from '#/state/queries/preferences';
import { useAgent } from '#/state/session';
import { useAnalytics } from '#/analytics';
import { IS_WEB } from '#/env';
import * as env from '#/env';
export function useLiveEventPreferences() {
    var _a;
    var query = usePreferencesQuery();
    useWebOnlyDebugLiveEventPreferences();
    return __assign(__assign({}, query), { data: ((_a = query.data) === null || _a === void 0 ? void 0 : _a.liveEventPreferences) || {
            hideAllFeeds: false,
            hiddenFeedIds: [],
        } });
}
function useWebOnlyDebugLiveEventPreferences() {
    var _this = this;
    var queryClient = useQueryClient();
    var agent = useAgent();
    useEffect(function () {
        if (env.IS_DEV && IS_WEB && typeof window !== 'undefined') {
            // @ts-ignore
            window.__updateLiveEventPreferences = function (action) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, agent.updateLiveEventPreferences(action)
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
            }); };
        }
    }, [agent, queryClient]);
}
export function useUpdateLiveEventPreferences(props) {
    var _this = this;
    var ax = useAnalytics();
    var queryClient = useQueryClient();
    var agent = useAgent();
    return useMutation({
        onSettled: function (data, error, variables) {
            var _a;
            /*
             * `onSettled` runs after the mutation completes, success or no. The idea
             * here is that we want to invert the action that was just passed in, and
             * provide it as an `undoAction` to the `onUpdateSuccess` callback.
             *
             * If the operation was not a success, we don't provide the `undoAction`.
             *
             * Upon the first call of the mutation, the `__canUndo` flag is undefined,
             * so we allow the undo. However, when we create the `undoAction`, we
             * set its `__canUndo` flag to false, so that if the user were to call
             * the undo action, we would not provide another undo for that.
             */
            var canUndo = variables.__canUndo === undefined ? true : false;
            var undoAction = null;
            switch (variables.type) {
                case 'hideFeed':
                    undoAction = { type: 'unhideFeed', id: variables.id, __canUndo: false };
                    break;
                case 'unhideFeed':
                    undoAction = { type: 'hideFeed', id: variables.id, __canUndo: false };
                    break;
                case 'toggleHideAllFeeds':
                    undoAction = { type: 'toggleHideAllFeeds', __canUndo: false };
                    break;
            }
            if (data && !error) {
                (_a = props === null || props === void 0 ? void 0 : props.onUpdateSuccess) === null || _a === void 0 ? void 0 : _a.call(props, {
                    undoAction: canUndo ? undoAction : null,
                });
            }
        },
        mutationFn: function (action) { return __awaiter(_this, void 0, void 0, function () {
            var updated, prefs;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, agent.updateLiveEventPreferences(action)];
                    case 1:
                        updated = _a.sent();
                        prefs = updated.find(function (p) {
                            return asPredicate(AppBskyActorDefs.validateLiveEventPreferences)(p);
                        });
                        switch (action.type) {
                            case 'hideFeed':
                            case 'unhideFeed': {
                                if (!props.feed) {
                                    ax.logger.error("useUpdateLiveEventPreferences: feed is missing, but required for hiding/unhiding", {
                                        action: action,
                                    });
                                    break;
                                }
                                ax.metric(action.type === 'hideFeed'
                                    ? 'liveEvents:feedBanner:hide'
                                    : 'liveEvents:feedBanner:unhide', {
                                    feed: props.feed.url,
                                    context: props.metricContext,
                                });
                                break;
                            }
                            case 'toggleHideAllFeeds': {
                                if (prefs.hideAllFeeds) {
                                    ax.metric('liveEvents:hideAllFeedBanners', {
                                        context: props.metricContext,
                                    });
                                }
                                else {
                                    ax.metric('liveEvents:unhideAllFeedBanners', {
                                        context: props.metricContext,
                                    });
                                }
                                break;
                            }
                        }
                        // triggers a refetch
                        queryClient.invalidateQueries({
                            queryKey: preferencesQueryKey,
                        });
                        return [2 /*return*/, prefs];
                }
            });
        }); },
    });
}
