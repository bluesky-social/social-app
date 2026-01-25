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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { useCallback } from 'react';
import { AppBskyUnspeccedDefs, AtUri, } from '@atproto/api';
import { useQueryClient } from '@tanstack/react-query';
import { dangerousGetPostShadow, updatePostShadow, } from '#/state/cache/post-shadow';
import { findAllPostsInQueryData as findAllPostsInExploreFeedPreviewsQueryData } from '#/state/queries/explore-feed-previews';
import { findAllPostsInQueryData as findAllPostsInNotifsQueryData } from '#/state/queries/notifications/feed';
import { findAllPostsInQueryData as findAllPostsInFeedQueryData } from '#/state/queries/post-feed';
import { findAllPostsInQueryData as findAllPostsInQuoteQueryData } from '#/state/queries/post-quotes';
import { findAllPostsInQueryData as findAllPostsInSearchQueryData } from '#/state/queries/search-posts';
import { usePostThreadContext } from '#/state/queries/usePostThread';
import { getBranch } from '#/state/queries/usePostThread/traversal';
import { postThreadQueryKeyRoot, } from '#/state/queries/usePostThread/types';
import { getRootPostAtUri } from '#/state/queries/usePostThread/utils';
import { postViewToThreadPlaceholder } from '#/state/queries/usePostThread/views';
import { didOrHandleUriMatches, getEmbeddedPost } from '#/state/queries/util';
import { embedViewRecordToPostView } from '#/state/queries/util';
export function createCacheMutator(_a) {
    var queryClient = _a.queryClient, postThreadQueryKey = _a.postThreadQueryKey, postThreadOtherQueryKey = _a.postThreadOtherQueryKey, params = _a.params;
    return {
        insertReplies: function (parentUri, replies) {
            /*
             * Main thread query mutator.
             */
            queryClient.setQueryData(postThreadQueryKey, function (data) {
                if (!data)
                    return;
                return __assign(__assign({}, data), { thread: mutator(__spreadArray([], data.thread, true)) });
            });
            /*
             * Additional replies query mutator.
             */
            queryClient.setQueryData(postThreadOtherQueryKey, function (data) {
                if (!data)
                    return;
                return __assign(__assign({}, data), { thread: mutator(__spreadArray([], data.thread, true)) });
            });
            function mutator(thread) {
                var _a, _b;
                var _loop_1 = function (i) {
                    var parent_1 = thread[i];
                    if (!AppBskyUnspeccedDefs.isThreadItemPost(parent_1.value))
                        return "continue";
                    if (parent_1.uri !== parentUri)
                        return "continue";
                    /*
                     * Update parent data
                     */
                    var shadow = dangerousGetPostShadow(parent_1.value.post);
                    var prevOptimisticCount = shadow === null || shadow === void 0 ? void 0 : shadow.optimisticReplyCount;
                    var prevReplyCount = parent_1.value.post.replyCount;
                    // prefer optimistic count, if we already have some
                    var currentReplyCount = ((_a = prevOptimisticCount !== null && prevOptimisticCount !== void 0 ? prevOptimisticCount : prevReplyCount) !== null && _a !== void 0 ? _a : 0) + 1;
                    /*
                     * We must update the value in the query cache in order for thread
                     * traversal to properly compute required metadata.
                     */
                    parent_1.value.post.replyCount = currentReplyCount;
                    /**
                     * Additionally, we need to update the post shadow to keep track of
                     * these new values, since mutating the post object above does not
                     * cause a re-render.
                     */
                    updatePostShadow(queryClient, parent_1.value.post.uri, {
                        optimisticReplyCount: currentReplyCount,
                    });
                    var opDid = (_b = getRootPostAtUri(parent_1.value.post)) === null || _b === void 0 ? void 0 : _b.host;
                    var nextPreexistingItem = thread.at(i + 1);
                    var isEndOfReplyChain = !nextPreexistingItem || nextPreexistingItem.depth <= parent_1.depth;
                    var isParentRoot = parent_1.depth === 0;
                    var isParentBelowRoot = parent_1.depth > 0;
                    var optimisticReply = replies.at(0);
                    var opIsReplier = AppBskyUnspeccedDefs.isThreadItemPost(optimisticReply === null || optimisticReply === void 0 ? void 0 : optimisticReply.value)
                        ? opDid === optimisticReply.value.post.author.did
                        : false;
                    /*
                     * Always insert replies if the following conditions are met. Max
                     * depth checks are handled below.
                     */
                    var canAlwaysInsertReplies = isParentRoot ||
                        (params.view === 'tree' && isParentBelowRoot) ||
                        (params.view === 'linear' && isEndOfReplyChain);
                    /*
                     * Maybe insert replies if we're in linear view, the replier is the
                     * OP, and certain conditions are met
                     */
                    var shouldReplaceWithOPReplies = params.view === 'linear' && opIsReplier && isParentBelowRoot;
                    if (canAlwaysInsertReplies || shouldReplaceWithOPReplies) {
                        var branch = getBranch(thread, i, parent_1.depth);
                        /*
                         * OP insertions replace other replies _in linear view_.
                         */
                        var itemsToRemove = shouldReplaceWithOPReplies ? branch.length : 0;
                        var itemsToInsert = replies
                            .map(function (r, ri) {
                            r.depth = parent_1.depth + 1 + ri;
                            return r;
                        })
                            .filter(function (r) {
                            // Filter out replies that are too deep for our UI
                            return r.depth <= params.below;
                        });
                        thread.splice.apply(thread, __spreadArray([i + 1, itemsToRemove], itemsToInsert, false));
                    }
                };
                for (var i = 0; i < thread.length; i++) {
                    _loop_1(i);
                }
                return thread;
            }
        },
        /**
         * Unused atm, post shadow does the trick, but it would be nice to clean up
         * the whole sub-tree on deletes.
         */
        deletePost: function (post) {
            queryClient.setQueryData(postThreadQueryKey, function (queryData) {
                if (!queryData)
                    return;
                var thread = __spreadArray([], queryData.thread, true);
                for (var i = 0; i < thread.length; i++) {
                    var existingPost = thread[i];
                    if (!AppBskyUnspeccedDefs.isThreadItemPost(post.value))
                        continue;
                    if (existingPost.uri === post.uri) {
                        var branch = getBranch(thread, i, existingPost.depth);
                        thread.splice(branch.start, branch.length);
                        break;
                    }
                }
                return __assign(__assign({}, queryData), { thread: thread });
            });
        },
    };
}
export function getThreadPlaceholder(queryClient, uri) {
    var partial;
    for (var _i = 0, _a = getThreadPlaceholderCandidates(queryClient, uri); _i < _a.length; _i++) {
        var item = _a[_i];
        /*
         * Currently, the backend doesn't send full post info in some cases (for
         * example, for quoted posts). We use missing `likeCount` as a way to
         * detect that. In the future, we should fix this on the backend, which
         * will let us always stop on the first result.
         *
         * TODO can we send in feeds and quotes?
         */
        var hasAllInfo = item.value.post.likeCount != null;
        if (hasAllInfo) {
            return item;
        }
        else {
            // Keep searching, we might still find a full post in the cache.
            partial = item;
        }
    }
    return partial;
}
export function getThreadPlaceholderCandidates(queryClient, uri) {
    var _i, _a, post, _b, _c, post, _d, _e, post, _f, _g, post, _h, _j, post, _k, _l, post;
    return __generator(this, function (_m) {
        switch (_m.label) {
            case 0:
                _i = 0, _a = findAllPostsInQueryData(queryClient, uri);
                _m.label = 1;
            case 1:
                if (!(_i < _a.length)) return [3 /*break*/, 4];
                post = _a[_i];
                return [4 /*yield*/, postViewToThreadPlaceholder(post)];
            case 2:
                _m.sent();
                _m.label = 3;
            case 3:
                _i++;
                return [3 /*break*/, 1];
            case 4:
                _b = 0, _c = findAllPostsInNotifsQueryData(queryClient, uri);
                _m.label = 5;
            case 5:
                if (!(_b < _c.length)) return [3 /*break*/, 8];
                post = _c[_b];
                return [4 /*yield*/, postViewToThreadPlaceholder(post)];
            case 6:
                _m.sent();
                _m.label = 7;
            case 7:
                _b++;
                return [3 /*break*/, 5];
            case 8:
                _d = 0, _e = findAllPostsInFeedQueryData(queryClient, uri);
                _m.label = 9;
            case 9:
                if (!(_d < _e.length)) return [3 /*break*/, 12];
                post = _e[_d];
                return [4 /*yield*/, postViewToThreadPlaceholder(post)];
            case 10:
                _m.sent();
                _m.label = 11;
            case 11:
                _d++;
                return [3 /*break*/, 9];
            case 12:
                _f = 0, _g = findAllPostsInQuoteQueryData(queryClient, uri);
                _m.label = 13;
            case 13:
                if (!(_f < _g.length)) return [3 /*break*/, 16];
                post = _g[_f];
                return [4 /*yield*/, postViewToThreadPlaceholder(post)];
            case 14:
                _m.sent();
                _m.label = 15;
            case 15:
                _f++;
                return [3 /*break*/, 13];
            case 16:
                _h = 0, _j = findAllPostsInSearchQueryData(queryClient, uri);
                _m.label = 17;
            case 17:
                if (!(_h < _j.length)) return [3 /*break*/, 20];
                post = _j[_h];
                return [4 /*yield*/, postViewToThreadPlaceholder(post)];
            case 18:
                _m.sent();
                _m.label = 19;
            case 19:
                _h++;
                return [3 /*break*/, 17];
            case 20:
                _k = 0, _l = findAllPostsInExploreFeedPreviewsQueryData(queryClient, uri);
                _m.label = 21;
            case 21:
                if (!(_k < _l.length)) return [3 /*break*/, 24];
                post = _l[_k];
                return [4 /*yield*/, postViewToThreadPlaceholder(post)];
            case 22:
                _m.sent();
                _m.label = 23;
            case 23:
                _k++;
                return [3 /*break*/, 21];
            case 24: return [2 /*return*/];
        }
    });
}
export function findAllPostsInQueryData(queryClient, uri) {
    var atUri, queryDatas, _i, queryDatas_1, _a, _queryKey, queryData, thread, _b, thread_1, item, qp;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                atUri = new AtUri(uri);
                queryDatas = queryClient.getQueriesData({
                    queryKey: [postThreadQueryKeyRoot],
                });
                _i = 0, queryDatas_1 = queryDatas;
                _c.label = 1;
            case 1:
                if (!(_i < queryDatas_1.length)) return [3 /*break*/, 8];
                _a = queryDatas_1[_i], _queryKey = _a[0], queryData = _a[1];
                if (!queryData)
                    return [3 /*break*/, 7];
                thread = queryData.thread;
                _b = 0, thread_1 = thread;
                _c.label = 2;
            case 2:
                if (!(_b < thread_1.length)) return [3 /*break*/, 7];
                item = thread_1[_b];
                if (!AppBskyUnspeccedDefs.isThreadItemPost(item.value)) return [3 /*break*/, 6];
                if (!didOrHandleUriMatches(atUri, item.value.post)) return [3 /*break*/, 4];
                return [4 /*yield*/, item.value.post];
            case 3:
                _c.sent();
                _c.label = 4;
            case 4:
                qp = getEmbeddedPost(item.value.post.embed);
                if (!(qp && didOrHandleUriMatches(atUri, qp))) return [3 /*break*/, 6];
                return [4 /*yield*/, embedViewRecordToPostView(qp)];
            case 5:
                _c.sent();
                _c.label = 6;
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
export function findAllProfilesInQueryData(queryClient, did) {
    var queryDatas, _i, queryDatas_2, _a, _queryKey, queryData, thread, _b, thread_2, item, qp;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                queryDatas = queryClient.getQueriesData({
                    queryKey: [postThreadQueryKeyRoot],
                });
                _i = 0, queryDatas_2 = queryDatas;
                _c.label = 1;
            case 1:
                if (!(_i < queryDatas_2.length)) return [3 /*break*/, 8];
                _a = queryDatas_2[_i], _queryKey = _a[0], queryData = _a[1];
                if (!queryData)
                    return [3 /*break*/, 7];
                thread = queryData.thread;
                _b = 0, thread_2 = thread;
                _c.label = 2;
            case 2:
                if (!(_b < thread_2.length)) return [3 /*break*/, 7];
                item = thread_2[_b];
                if (!AppBskyUnspeccedDefs.isThreadItemPost(item.value)) return [3 /*break*/, 6];
                if (!(item.value.post.author.did === did)) return [3 /*break*/, 4];
                return [4 /*yield*/, item.value.post.author];
            case 3:
                _c.sent();
                _c.label = 4;
            case 4:
                qp = getEmbeddedPost(item.value.post.embed);
                if (!(qp && qp.author.did === did)) return [3 /*break*/, 6];
                return [4 /*yield*/, qp.author];
            case 5:
                _c.sent();
                _c.label = 6;
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
export function useUpdatePostThreadThreadgateQueryCache() {
    var qc = useQueryClient();
    var context = usePostThreadContext();
    return useCallback(function (threadgate) {
        if (!context)
            return;
        function mutator(thread) {
            for (var i = 0; i < thread.length; i++) {
                var item = thread[i];
                if (!AppBskyUnspeccedDefs.isThreadItemPost(item.value))
                    continue;
                if (item.depth === 0) {
                    thread.splice(i, 1, __assign(__assign({}, item), { value: __assign(__assign({}, item.value), { post: __assign(__assign({}, item.value.post), { threadgate: threadgate }) }) }));
                }
            }
            return thread;
        }
        qc.setQueryData(context.postThreadQueryKey, function (data) {
            if (!data)
                return;
            return __assign(__assign({}, data), { thread: mutator(__spreadArray([], data.thread, true)) });
        });
    }, [qc, context]);
}
