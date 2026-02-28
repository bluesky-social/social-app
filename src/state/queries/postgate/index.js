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
import React from 'react';
import { AppBskyEmbedRecord, AppBskyEmbedRecordWithMedia, AppBskyFeedPostgate, AtUri, } from '@atproto/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { networkRetry, retry } from '#/lib/async/retry';
import { logger } from '#/logger';
import { updatePostShadow } from '#/state/cache/post-shadow';
import { STALE } from '#/state/queries';
import { useGetPosts } from '#/state/queries/post';
import { createMaybeDetachedQuoteEmbed, createPostgateRecord, mergePostgateRecords, POSTGATE_COLLECTION, } from '#/state/queries/postgate/util';
import { useAgent } from '#/state/session';
import * as bsky from '#/types/bsky';
export function getPostgateRecord(_a) {
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
                                collection: POSTGATE_COLLECTION,
                                rkey: urip.rkey,
                            });
                        })];
                case 3:
                    data = (_c.sent()).data;
                    if (data.value &&
                        bsky.validate(data.value, AppBskyFeedPostgate.validateRecord)) {
                        return [2 /*return*/, data.value];
                    }
                    else {
                        return [2 /*return*/, undefined];
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
                        return [2 /*return*/, undefined];
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
export function writePostgateRecord(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var postUrip;
        var agent = _b.agent, postUri = _b.postUri, postgate = _b.postgate;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    postUrip = new AtUri(postUri);
                    return [4 /*yield*/, networkRetry(2, function () {
                            return agent.api.com.atproto.repo.putRecord({
                                repo: agent.session.did,
                                collection: POSTGATE_COLLECTION,
                                rkey: postUrip.rkey,
                                record: postgate,
                            });
                        })];
                case 1:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
export function upsertPostgate(_a, callback_1) {
    return __awaiter(this, arguments, void 0, function (_b, callback) {
        var prev, next;
        var agent = _b.agent, postUri = _b.postUri;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, getPostgateRecord({
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
                    return [4 /*yield*/, writePostgateRecord({
                            agent: agent,
                            postUri: postUri,
                            postgate: next,
                        })];
                case 3:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
export var createPostgateQueryKey = function (postUri) { return [
    'postgate-record',
    postUri,
]; };
export function usePostgateQuery(_a) {
    var postUri = _a.postUri;
    var agent = useAgent();
    return useQuery({
        staleTime: STALE.SECONDS.THIRTY,
        queryKey: createPostgateQueryKey(postUri),
        queryFn: function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, getPostgateRecord({ agent: agent, postUri: postUri }).then(function (res) { return res !== null && res !== void 0 ? res : null; })];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        },
    });
}
export function useWritePostgateMutation() {
    var _this = this;
    var agent = useAgent();
    var queryClient = useQueryClient();
    return useMutation({
        mutationFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var postUri = _b.postUri, postgate = _b.postgate;
            return __generator(this, function (_c) {
                return [2 /*return*/, writePostgateRecord({
                        agent: agent,
                        postUri: postUri,
                        postgate: postgate,
                    })];
            });
        }); },
        onSuccess: function (_, _a) {
            var postUri = _a.postUri;
            queryClient.invalidateQueries({
                queryKey: createPostgateQueryKey(postUri),
            });
        },
    });
}
export function useToggleQuoteDetachmentMutation() {
    var _this = this;
    var agent = useAgent();
    var queryClient = useQueryClient();
    var getPosts = useGetPosts();
    var prevEmbed = React.useRef(undefined);
    return useMutation({
        mutationFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var _this = this;
            var post = _b.post, quoteUri = _b.quoteUri, action = _b.action;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        // cache here since post shadow mutates original object
                        prevEmbed.current = post.embed;
                        if (action === 'detach') {
                            updatePostShadow(queryClient, post.uri, {
                                embed: createMaybeDetachedQuoteEmbed({
                                    post: post,
                                    quote: undefined,
                                    quoteUri: quoteUri,
                                    detached: true,
                                }),
                            });
                        }
                        return [4 /*yield*/, upsertPostgate({ agent: agent, postUri: quoteUri }, function (prev) { return __awaiter(_this, void 0, void 0, function () {
                                var _a;
                                return __generator(this, function (_b) {
                                    if (prev) {
                                        if (action === 'detach') {
                                            return [2 /*return*/, mergePostgateRecords(prev, {
                                                    detachedEmbeddingUris: [post.uri],
                                                })];
                                        }
                                        else if (action === 'reattach') {
                                            return [2 /*return*/, __assign(__assign({}, prev), { detachedEmbeddingUris: ((_a = prev.detachedEmbeddingUris) === null || _a === void 0 ? void 0 : _a.filter(function (uri) { return uri !== post.uri; })) ||
                                                        [] })];
                                        }
                                    }
                                    else {
                                        if (action === 'detach') {
                                            return [2 /*return*/, createPostgateRecord({
                                                    post: quoteUri,
                                                    detachedEmbeddingUris: [post.uri],
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
        onSuccess: function (_data_1, _a) {
            return __awaiter(this, arguments, void 0, function (_data, _b) {
                var quote, e_2;
                var post = _b.post, quoteUri = _b.quoteUri, action = _b.action;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            if (!(action === 'reattach')) return [3 /*break*/, 4];
                            _c.label = 1;
                        case 1:
                            _c.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, getPosts({ uris: [quoteUri] })];
                        case 2:
                            quote = (_c.sent())[0];
                            updatePostShadow(queryClient, post.uri, {
                                embed: createMaybeDetachedQuoteEmbed({
                                    post: post,
                                    quote: quote,
                                    quoteUri: undefined,
                                    detached: false,
                                }),
                            });
                            return [3 /*break*/, 4];
                        case 3:
                            e_2 = _c.sent();
                            // ok if this fails, it's just optimistic UI
                            logger.error("Postgate: failed to get quote post for re-attachment", {
                                safeMessage: e_2.message,
                            });
                            return [3 /*break*/, 4];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        },
        onError: function (_, _a) {
            var post = _a.post, action = _a.action;
            if (action === 'detach' && prevEmbed.current) {
                // detach failed, add the embed back
                if (AppBskyEmbedRecord.isView(prevEmbed.current) ||
                    AppBskyEmbedRecordWithMedia.isView(prevEmbed.current)) {
                    updatePostShadow(queryClient, post.uri, {
                        embed: prevEmbed.current,
                    });
                }
            }
        },
        onSettled: function () {
            prevEmbed.current = undefined;
        },
    });
}
export function useToggleQuotepostEnabledMutation() {
    var _this = this;
    var agent = useAgent();
    return useMutation({
        mutationFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var _this = this;
            var postUri = _b.postUri, action = _b.action;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, upsertPostgate({ agent: agent, postUri: postUri }, function (prev) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                if (prev) {
                                    if (action === 'disable') {
                                        return [2 /*return*/, mergePostgateRecords(prev, {
                                                embeddingRules: [{ $type: 'app.bsky.feed.postgate#disableRule' }],
                                            })];
                                    }
                                    else if (action === 'enable') {
                                        return [2 /*return*/, __assign(__assign({}, prev), { embeddingRules: [] })];
                                    }
                                }
                                else {
                                    if (action === 'disable') {
                                        return [2 /*return*/, createPostgateRecord({
                                                post: postUri,
                                                embeddingRules: [{ $type: 'app.bsky.feed.postgate#disableRule' }],
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
    });
}
