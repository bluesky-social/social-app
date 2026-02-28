/**
 * NOTE
 * The ./unread.ts API:
 *
 * - Provides a `checkUnread()` function to sync with the server,
 * - Periodically calls `checkUnread()`, and
 * - Caches the first page of notifications.
 *
 * IMPORTANT: This query uses ./unread.ts's cache as its first page,
 * IMPORTANT: which means the cache-freshness of this query is driven by the unread API.
 *
 * Follow these rules:
 *
 * 1. Call `checkUnread()` if you want to fetch latest in the background.
 * 2. Call `checkUnread({invalidate: true})` if you want latest to sync into this query's results immediately.
 * 3. Don't call this query's `refetch()` if you're trying to sync latest; call `checkUnread()` instead.
 */
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { AppBskyFeedDefs, AppBskyFeedPost, AtUri, moderatePost, } from '@atproto/api';
import { useInfiniteQuery, useQueryClient, } from '@tanstack/react-query';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { STALE } from '#/state/queries';
import { useAgent } from '#/state/session';
import { useThreadgateHiddenReplyUris } from '#/state/threadgate-hidden-replies';
import { didOrHandleUriMatches, embedViewRecordToPostView, getEmbeddedPost, } from '../util';
import { useUnreadNotificationsApi } from './unread';
import { fetchPage } from './util';
var PAGE_SIZE = 30;
var RQKEY_ROOT = 'notification-feed';
export function RQKEY(filter) {
    return [RQKEY_ROOT, filter];
}
export function useNotificationFeedQuery(opts) {
    var agent = useAgent();
    var queryClient = useQueryClient();
    var moderationOpts = useModerationOpts();
    var unreads = useUnreadNotificationsApi();
    var enabled = opts.enabled !== false;
    var filter = opts.filter;
    var hiddenReplyUris = useThreadgateHiddenReplyUris().uris;
    var selectArgs = useMemo(function () {
        return {
            moderationOpts: moderationOpts,
            hiddenReplyUris: hiddenReplyUris,
        };
    }, [moderationOpts, hiddenReplyUris]);
    var lastRun = useRef(null);
    var query = useInfiniteQuery({
        staleTime: STALE.INFINITY,
        queryKey: RQKEY(filter),
        queryFn: function (_a) {
            return __awaiter(this, arguments, void 0, function (_b) {
                var page, reasons, fetchedPage;
                var pageParam = _b.pageParam;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            if (filter === 'all' && !pageParam) {
                                // for the first page, we check the cached page held by the unread-checker first
                                page = unreads.getCachedUnreadPage();
                            }
                            if (!!page) return [3 /*break*/, 2];
                            reasons = [];
                            if (filter === 'mentions') {
                                reasons = [
                                    // Anything that's a post
                                    'mention',
                                    'reply',
                                    'quote',
                                ];
                            }
                            return [4 /*yield*/, fetchPage({
                                    agent: agent,
                                    limit: PAGE_SIZE,
                                    cursor: pageParam,
                                    queryClient: queryClient,
                                    moderationOpts: moderationOpts,
                                    fetchAdditionalData: true,
                                    reasons: reasons,
                                })];
                        case 1:
                            fetchedPage = (_c.sent()).page;
                            page = fetchedPage;
                            _c.label = 2;
                        case 2:
                            if (filter === 'all' && !pageParam) {
                                // if the first page has an unread, mark all read
                                unreads.markAllRead();
                            }
                            return [2 /*return*/, page];
                    }
                });
            });
        },
        initialPageParam: undefined,
        getNextPageParam: function (lastPage) { return lastPage.cursor; },
        enabled: enabled,
        select: useCallback(function (data) {
            var _a;
            var moderationOpts = selectArgs.moderationOpts, hiddenReplyUris = selectArgs.hiddenReplyUris;
            // Keep track of the last run and whether we can reuse
            // some already selected pages from there.
            var reusedPages = [];
            if (lastRun.current) {
                var _b = lastRun.current, lastData = _b.data, lastArgs = _b.args, lastResult = _b.result;
                var canReuse = true;
                for (var key in selectArgs) {
                    if (selectArgs.hasOwnProperty(key)) {
                        if (selectArgs[key] !== lastArgs[key]) {
                            // Can't do reuse anything if any input has changed.
                            canReuse = false;
                            break;
                        }
                    }
                }
                if (canReuse) {
                    for (var i = 0; i < data.pages.length; i++) {
                        if (data.pages[i] && lastData.pages[i] === data.pages[i]) {
                            reusedPages.push(lastResult.pages[i]);
                            continue;
                        }
                        // Stop as soon as pages stop matching up.
                        break;
                    }
                }
            }
            // override 'isRead' using the first page's returned seenAt
            // we do this because the `markAllRead()` call above will
            // mark subsequent pages as read prematurely
            var seenAt = ((_a = data.pages[0]) === null || _a === void 0 ? void 0 : _a.seenAt) || new Date();
            for (var _i = 0, _c = data.pages; _i < _c.length; _i++) {
                var page = _c[_i];
                for (var _d = 0, _e = page.items; _d < _e.length; _d++) {
                    var item = _e[_d];
                    item.notification.isRead =
                        seenAt > new Date(item.notification.indexedAt);
                }
            }
            var result = __assign(__assign({}, data), { pages: __spreadArray(__spreadArray([], reusedPages, true), data.pages.slice(reusedPages.length).map(function (page) {
                    return __assign(__assign({}, page), { items: page.items
                            .filter(function (item) {
                            var isHiddenReply = item.type === 'reply' &&
                                item.subjectUri &&
                                hiddenReplyUris.has(item.subjectUri);
                            return !isHiddenReply;
                        })
                            .filter(function (item) {
                            var _a;
                            if (item.type === 'reply' ||
                                item.type === 'mention' ||
                                item.type === 'quote') {
                                /*
                                 * The `isPostView` check will fail here bc we don't have
                                 * a `$type` field on the `subject`. But if the nested
                                 * `record` is a post, we know it's a post view.
                                 */
                                if (AppBskyFeedPost.isRecord((_a = item.subject) === null || _a === void 0 ? void 0 : _a.record)) {
                                    var mod = moderatePost(item.subject, moderationOpts);
                                    if (mod.ui('contentList').filter) {
                                        return false;
                                    }
                                }
                            }
                            return true;
                        }) });
                }), true) });
            lastRun.current = { data: data, result: result, args: selectArgs };
            return result;
        }, [selectArgs]),
    });
    // The server may end up returning an empty page, a page with too few items,
    // or a page with items that end up getting filtered out. When we fetch pages,
    // we'll keep track of how many items we actually hope to see. If the server
    // doesn't return enough items, we're going to continue asking for more items.
    var lastItemCount = useRef(0);
    var wantedItemCount = useRef(0);
    var autoPaginationAttemptCount = useRef(0);
    useEffect(function () {
        var data = query.data, isLoading = query.isLoading, isRefetching = query.isRefetching, isFetchingNextPage = query.isFetchingNextPage, hasNextPage = query.hasNextPage;
        // Count the items that we already have.
        var itemCount = 0;
        for (var _i = 0, _a = (data === null || data === void 0 ? void 0 : data.pages) || []; _i < _a.length; _i++) {
            var page = _a[_i];
            itemCount += page.items.length;
        }
        // If items got truncated, reset the state we're tracking below.
        if (itemCount !== lastItemCount.current) {
            if (itemCount < lastItemCount.current) {
                wantedItemCount.current = itemCount;
            }
            lastItemCount.current = itemCount;
        }
        // Now track how many items we really want, and fetch more if needed.
        if (isLoading || isRefetching) {
            // During the initial fetch, we want to get an entire page's worth of items.
            wantedItemCount.current = PAGE_SIZE;
        }
        else if (isFetchingNextPage) {
            if (itemCount > wantedItemCount.current) {
                // We have more items than wantedItemCount, so wantedItemCount must be out of date.
                // Some other code must have called fetchNextPage(), for example, from onEndReached.
                // Adjust the wantedItemCount to reflect that we want one more full page of items.
                wantedItemCount.current = itemCount + PAGE_SIZE;
            }
        }
        else if (hasNextPage) {
            // At this point we're not fetching anymore, so it's time to make a decision.
            // If we didn't receive enough items from the server, paginate again until we do.
            if (itemCount < wantedItemCount.current) {
                autoPaginationAttemptCount.current++;
                if (autoPaginationAttemptCount.current < 50 /* failsafe */) {
                    query.fetchNextPage();
                }
            }
            else {
                autoPaginationAttemptCount.current = 0;
            }
        }
    }, [query]);
    return query;
}
export function findAllPostsInQueryData(queryClient, uri) {
    var atUri, queryDatas, _i, queryDatas_1, _a, _queryKey, queryData, _b, _c, page, _d, _e, item, quotedPost;
    var _f;
    return __generator(this, function (_g) {
        switch (_g.label) {
            case 0:
                atUri = new AtUri(uri);
                queryDatas = queryClient.getQueriesData({
                    queryKey: [RQKEY_ROOT],
                });
                _i = 0, queryDatas_1 = queryDatas;
                _g.label = 1;
            case 1:
                if (!(_i < queryDatas_1.length)) return [3 /*break*/, 10];
                _a = queryDatas_1[_i], _queryKey = _a[0], queryData = _a[1];
                if (!(queryData === null || queryData === void 0 ? void 0 : queryData.pages)) {
                    return [3 /*break*/, 9];
                }
                _b = 0, _c = queryData === null || queryData === void 0 ? void 0 : queryData.pages;
                _g.label = 2;
            case 2:
                if (!(_b < _c.length)) return [3 /*break*/, 9];
                page = _c[_b];
                _d = 0, _e = page.items;
                _g.label = 3;
            case 3:
                if (!(_d < _e.length)) return [3 /*break*/, 8];
                item = _e[_d];
                if (!(item.type !== 'starterpack-joined')) return [3 /*break*/, 5];
                if (!(item.subject && didOrHandleUriMatches(atUri, item.subject))) return [3 /*break*/, 5];
                return [4 /*yield*/, item.subject];
            case 4:
                _g.sent();
                _g.label = 5;
            case 5:
                if (!AppBskyFeedDefs.isPostView(item.subject)) return [3 /*break*/, 7];
                quotedPost = getEmbeddedPost((_f = item.subject) === null || _f === void 0 ? void 0 : _f.embed);
                if (!(quotedPost && didOrHandleUriMatches(atUri, quotedPost))) return [3 /*break*/, 7];
                return [4 /*yield*/, embedViewRecordToPostView(quotedPost)];
            case 6:
                _g.sent();
                _g.label = 7;
            case 7:
                _d++;
                return [3 /*break*/, 3];
            case 8:
                _b++;
                return [3 /*break*/, 2];
            case 9:
                _i++;
                return [3 /*break*/, 1];
            case 10: return [2 /*return*/];
        }
    });
}
export function findAllProfilesInQueryData(queryClient, did) {
    var queryDatas, _i, queryDatas_2, _a, _queryKey, queryData, _b, _c, page, _d, _e, item, quotedPost;
    var _f, _g;
    return __generator(this, function (_h) {
        switch (_h.label) {
            case 0:
                queryDatas = queryClient.getQueriesData({
                    queryKey: [RQKEY_ROOT],
                });
                _i = 0, queryDatas_2 = queryDatas;
                _h.label = 1;
            case 1:
                if (!(_i < queryDatas_2.length)) return [3 /*break*/, 12];
                _a = queryDatas_2[_i], _queryKey = _a[0], queryData = _a[1];
                if (!(queryData === null || queryData === void 0 ? void 0 : queryData.pages)) {
                    return [3 /*break*/, 11];
                }
                _b = 0, _c = queryData === null || queryData === void 0 ? void 0 : queryData.pages;
                _h.label = 2;
            case 2:
                if (!(_b < _c.length)) return [3 /*break*/, 11];
                page = _c[_b];
                _d = 0, _e = page.items;
                _h.label = 3;
            case 3:
                if (!(_d < _e.length)) return [3 /*break*/, 10];
                item = _e[_d];
                if (!((item.type === 'follow' || item.type === 'contact-match') &&
                    item.notification.author.did === did)) return [3 /*break*/, 5];
                return [4 /*yield*/, item.notification.author];
            case 4:
                _h.sent();
                return [3 /*break*/, 7];
            case 5:
                if (!(item.type !== 'starterpack-joined' &&
                    ((_f = item.subject) === null || _f === void 0 ? void 0 : _f.author.did) === did)) return [3 /*break*/, 7];
                return [4 /*yield*/, item.subject.author];
            case 6:
                _h.sent();
                _h.label = 7;
            case 7:
                if (!AppBskyFeedDefs.isPostView(item.subject)) return [3 /*break*/, 9];
                quotedPost = getEmbeddedPost((_g = item.subject) === null || _g === void 0 ? void 0 : _g.embed);
                if (!((quotedPost === null || quotedPost === void 0 ? void 0 : quotedPost.author.did) === did)) return [3 /*break*/, 9];
                return [4 /*yield*/, quotedPost.author];
            case 8:
                _h.sent();
                _h.label = 9;
            case 9:
                _d++;
                return [3 /*break*/, 3];
            case 10:
                _b++;
                return [3 /*break*/, 2];
            case 11:
                _i++;
                return [3 /*break*/, 1];
            case 12: return [2 /*return*/];
        }
    });
}
