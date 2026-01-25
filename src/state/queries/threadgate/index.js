var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
import { AppBskyFeedThreadgate, AtUri, } from '@atproto/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { networkRetry, retry } from '#/lib/async/retry';
import { STALE } from '#/state/queries';
import { useGetPost } from '#/state/queries/post';
import { createThreadgateRecord, mergeThreadgateRecords, threadgateAllowUISettingToAllowRecordValue, threadgateViewToAllowUISetting, } from '#/state/queries/threadgate/util';
import { useUpdatePostThreadThreadgateQueryCache } from '#/state/queries/usePostThread';
import { useAgent } from '#/state/session';
import { useThreadgateHiddenReplyUrisAPI } from '#/state/threadgate-hidden-replies';
import * as bsky from '#/types/bsky';
export * from '#/state/queries/threadgate/types';
export * from '#/state/queries/threadgate/util';
/**
 * Must match the threadgate lexicon record definition.
 */
export var MAX_HIDDEN_REPLIES = 300;
export var threadgateRecordQueryKeyRoot = 'threadgate-record';
export var createThreadgateRecordQueryKey = function (uri) { return [
    threadgateRecordQueryKeyRoot,
    uri,
]; };
export function useThreadgateRecordQuery(_a) {
    var _b = _a === void 0 ? {} : _a, postUri = _b.postUri, initialData = _b.initialData;
    var agent = useAgent();
    return useQuery({
        enabled: !!postUri,
        queryKey: createThreadgateRecordQueryKey(postUri || ''),
        placeholderData: initialData,
        staleTime: STALE.MINUTES.ONE,
        queryFn: function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, getThreadgateRecord({
                            agent: agent,
                            postUri: postUri,
                        })];
                });
            });
        },
    });
}
export var threadgateViewQueryKeyRoot = 'threadgate-view';
export var createThreadgateViewQueryKey = function (uri) { return [
    threadgateViewQueryKeyRoot,
    uri,
]; };
export function useThreadgateViewQuery(_a) {
    var _b = _a === void 0 ? {} : _a, postUri = _b.postUri, initialData = _b.initialData;
    var getPost = useGetPost();
    return useQuery({
        enabled: !!postUri,
        queryKey: createThreadgateViewQueryKey(postUri || ''),
        placeholderData: initialData,
        staleTime: STALE.MINUTES.ONE,
        queryFn: function () {
            return __awaiter(this, void 0, void 0, function () {
                var post;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, getPost({ uri: postUri })];
                        case 1:
                            post = _b.sent();
                            return [2 /*return*/, (_a = post.threadgate) !== null && _a !== void 0 ? _a : null];
                    }
                });
            });
        },
    });
}
export function getThreadgateRecord(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var urip, res, data, e_1;
        var agent = _b.agent, postUri = _b.postUri;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    urip = new AtUri(postUri);
                    if (!!urip.host.startsWith('did:')) return [3 /*break*/, 2];
                    return [4 /*yield*/, agent.resolveHandle({
                            handle: urip.host,
                        })
                        // @ts-expect-error TODO new-sdk-migration
                    ];
                case 1:
                    res = _c.sent();
                    // @ts-expect-error TODO new-sdk-migration
                    urip.host = res.data.did;
                    _c.label = 2;
                case 2:
                    _c.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, retry(2, function (e) {
                            /*
                             * If the record doesn't exist, we want to return null instead of
                             * throwing an error. NB: This will also catch reference errors, such as
                             * a typo in the URI.
                             */
                            if (e.message.includes("Could not locate record:")) {
                                return false;
                            }
                            return true;
                        }, function () {
                            return agent.api.com.atproto.repo.getRecord({
                                repo: urip.host,
                                collection: 'app.bsky.feed.threadgate',
                                rkey: urip.rkey,
                            });
                        })];
                case 3:
                    data = (_c.sent()).data;
                    if (data.value &&
                        bsky.validate(data.value, AppBskyFeedThreadgate.validateRecord)) {
                        return [2 /*return*/, data.value];
                    }
                    else {
                        return [2 /*return*/, null];
                    }
                    return [3 /*break*/, 5];
                case 4:
                    e_1 = _c.sent();
                    /*
                     * If the record doesn't exist, we want to return null instead of
                     * throwing an error. NB: This will also catch reference errors, such as
                     * a typo in the URI.
                     */
                    if (e_1.message.includes("Could not locate record:")) {
                        return [2 /*return*/, null];
                    }
                    else {
                        throw e_1;
                    }
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
export function writeThreadgateRecord(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var postUrip, record;
        var agent = _b.agent, postUri = _b.postUri, threadgate = _b.threadgate;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    postUrip = new AtUri(postUri);
                    record = createThreadgateRecord({
                        post: postUri,
                        allow: threadgate.allow, // can/should be undefined!
                        hiddenReplies: threadgate.hiddenReplies || [],
                    });
                    return [4 /*yield*/, networkRetry(2, function () {
                            return agent.api.com.atproto.repo.putRecord({
                                repo: agent.session.did,
                                collection: 'app.bsky.feed.threadgate',
                                rkey: postUrip.rkey,
                                record: record,
                            });
                        })];
                case 1:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
export function upsertThreadgate(_a, callback_1) {
    return __awaiter(this, arguments, void 0, function (_b, callback) {
        var prev, next;
        var agent = _b.agent, postUri = _b.postUri;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, getThreadgateRecord({
                        agent: agent,
                        postUri: postUri,
                    })];
                case 1:
                    prev = _c.sent();
                    return [4 /*yield*/, callback(prev)];
                case 2:
                    next = _c.sent();
                    if (!next)
                        return [2 /*return*/];
                    validateThreadgateRecordOrThrow(next);
                    return [4 /*yield*/, writeThreadgateRecord({
                            agent: agent,
                            postUri: postUri,
                            threadgate: next,
                        })];
                case 3:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * Update the allow list for a threadgate record.
 */
export function updateThreadgateAllow(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var _this = this;
        var agent = _b.agent, postUri = _b.postUri, allow = _b.allow;
        return __generator(this, function (_c) {
            return [2 /*return*/, upsertThreadgate({ agent: agent, postUri: postUri }, function (prev) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        if (prev) {
                            return [2 /*return*/, __assign(__assign({}, prev), { allow: threadgateAllowUISettingToAllowRecordValue(allow) })];
                        }
                        else {
                            return [2 /*return*/, createThreadgateRecord({
                                    post: postUri,
                                    allow: threadgateAllowUISettingToAllowRecordValue(allow),
                                })];
                        }
                        return [2 /*return*/];
                    });
                }); })];
        });
    });
}
export function useSetThreadgateAllowMutation() {
    var _this = this;
    var agent = useAgent();
    var queryClient = useQueryClient();
    var getPost = useGetPost();
    var updatePostThreadThreadgate = useUpdatePostThreadThreadgateQueryCache();
    return useMutation({
        mutationFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var _this = this;
            var postUri = _b.postUri, allow = _b.allow;
            return __generator(this, function (_c) {
                return [2 /*return*/, upsertThreadgate({ agent: agent, postUri: postUri }, function (prev) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            if (prev) {
                                return [2 /*return*/, __assign(__assign({}, prev), { allow: threadgateAllowUISettingToAllowRecordValue(allow) })];
                            }
                            else {
                                return [2 /*return*/, createThreadgateRecord({
                                        post: postUri,
                                        allow: threadgateAllowUISettingToAllowRecordValue(allow),
                                    })];
                            }
                            return [2 /*return*/];
                        });
                    }); })];
            });
        }); },
        onSuccess: function (_1, _a) {
            return __awaiter(this, arguments, void 0, function (_, _b) {
                var data;
                var _this = this;
                var postUri = _b.postUri, allow = _b.allow;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, retry(5, // 5 tries
                            function (// 5 tries
                            _e) { return true; }, function () { return __awaiter(_this, void 0, void 0, function () {
                                var post, threadgate, fetchedSettings, isReady;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, getPost({ uri: postUri })];
                                        case 1:
                                            post = _a.sent();
                                            threadgate = post.threadgate;
                                            if (!threadgate) {
                                                throw new Error("useSetThreadgateAllowMutation: could not fetch threadgate, appview may not be ready yet");
                                            }
                                            fetchedSettings = threadgateViewToAllowUISetting(threadgate);
                                            isReady = JSON.stringify(fetchedSettings) === JSON.stringify(allow);
                                            if (!isReady) {
                                                throw new Error("useSetThreadgateAllowMutation: appview isn't ready yet"); // try again
                                            }
                                            return [2 /*return*/, threadgate];
                                    }
                                });
                            }); }, 1e3).catch(function () { })];
                        case 1:
                            data = _c.sent();
                            if (data)
                                updatePostThreadThreadgate(data);
                            queryClient.invalidateQueries({
                                queryKey: [threadgateRecordQueryKeyRoot],
                            });
                            queryClient.invalidateQueries({
                                queryKey: [threadgateViewQueryKeyRoot],
                            });
                            return [2 /*return*/];
                    }
                });
            });
        },
    });
}
export function useToggleReplyVisibilityMutation() {
    var _this = this;
    var agent = useAgent();
    var queryClient = useQueryClient();
    var hiddenReplies = useThreadgateHiddenReplyUrisAPI();
    return useMutation({
        mutationFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var _this = this;
            var postUri = _b.postUri, replyUri = _b.replyUri, action = _b.action;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (action === 'hide') {
                            hiddenReplies.addHiddenReplyUri(replyUri);
                        }
                        else if (action === 'show') {
                            hiddenReplies.removeHiddenReplyUri(replyUri);
                        }
                        return [4 /*yield*/, upsertThreadgate({ agent: agent, postUri: postUri }, function (prev) { return __awaiter(_this, void 0, void 0, function () {
                                var _a;
                                return __generator(this, function (_b) {
                                    if (prev) {
                                        if (action === 'hide') {
                                            return [2 /*return*/, mergeThreadgateRecords(prev, {
                                                    hiddenReplies: [replyUri],
                                                })];
                                        }
                                        else if (action === 'show') {
                                            return [2 /*return*/, __assign(__assign({}, prev), { hiddenReplies: ((_a = prev.hiddenReplies) === null || _a === void 0 ? void 0 : _a.filter(function (uri) { return uri !== replyUri; })) || [] })];
                                        }
                                    }
                                    else {
                                        if (action === 'hide') {
                                            return [2 /*return*/, createThreadgateRecord({
                                                    post: postUri,
                                                    hiddenReplies: [replyUri],
                                                })];
                                        }
                                    }
                                    return [2 /*return*/];
                                });
                            }); })];
                    case 1:
                        _c.sent();
                        return [2 /*return*/];
                }
            });
        }); },
        onSuccess: function () {
            queryClient.invalidateQueries({
                queryKey: [threadgateRecordQueryKeyRoot],
            });
        },
        onError: function (_, _a) {
            var replyUri = _a.replyUri, action = _a.action;
            if (action === 'hide') {
                hiddenReplies.removeHiddenReplyUri(replyUri);
            }
            else if (action === 'show') {
                hiddenReplies.addHiddenReplyUri(replyUri);
            }
        },
    });
}
var MaxHiddenRepliesError = /** @class */ (function (_super) {
    __extends(MaxHiddenRepliesError, _super);
    function MaxHiddenRepliesError(message) {
        var _this = _super.call(this, message || 'Maximum number of hidden replies reached') || this;
        _this.name = 'MaxHiddenRepliesError';
        return _this;
    }
    return MaxHiddenRepliesError;
}(Error));
export { MaxHiddenRepliesError };
var InvalidInteractionSettingsError = /** @class */ (function (_super) {
    __extends(InvalidInteractionSettingsError, _super);
    function InvalidInteractionSettingsError(message) {
        var _this = _super.call(this, message || 'Invalid interaction settings') || this;
        _this.name = 'InvalidInteractionSettingsError';
        return _this;
    }
    return InvalidInteractionSettingsError;
}(Error));
export { InvalidInteractionSettingsError };
export function validateThreadgateRecordOrThrow(record) {
    var _a, _b;
    var result = AppBskyFeedThreadgate.validateRecord(record);
    if (result.success) {
        if (((_b = (_a = result.value.hiddenReplies) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0) > MAX_HIDDEN_REPLIES) {
            throw new MaxHiddenRepliesError();
        }
    }
    else {
        throw new InvalidInteractionSettingsError();
    }
}
