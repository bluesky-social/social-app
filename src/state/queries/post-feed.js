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
import React, { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { AppBskyFeedDefs, AtUri, moderatePost, } from '@atproto/api';
import { useInfiniteQuery, } from '@tanstack/react-query';
import { AuthorFeedAPI } from '#/lib/api/feed/author';
import { CustomFeedAPI } from '#/lib/api/feed/custom';
import { DemoFeedAPI } from '#/lib/api/feed/demo';
import { FollowingFeedAPI } from '#/lib/api/feed/following';
import { HomeFeedAPI } from '#/lib/api/feed/home';
import { LikesFeedAPI } from '#/lib/api/feed/likes';
import { ListFeedAPI } from '#/lib/api/feed/list';
import { MergeFeedAPI } from '#/lib/api/feed/merge';
import { PostListFeedAPI } from '#/lib/api/feed/posts';
import { aggregateUserInterests } from '#/lib/api/feed/utils';
import { FeedTuner } from '#/lib/api/feed-manip';
import { DISCOVER_FEED_URI } from '#/lib/constants';
import { logger } from '#/logger';
import { STALE } from '#/state/queries';
import { DEFAULT_LOGGED_OUT_PREFERENCES } from '#/state/queries/preferences/const';
import { useAgent } from '#/state/session';
import * as userActionHistory from '#/state/userActionHistory';
import { KnownError } from '#/view/com/posts/PostFeedErrorMessage';
import { useFeedTuners } from '../preferences/feed-tuners';
import { useModerationOpts } from '../preferences/moderation-opts';
import { usePreferencesQuery } from './preferences';
import { didOrHandleUriMatches, embedViewRecordToPostView, getEmbeddedPost, } from './util';
export var RQKEY_ROOT = 'post-feed';
export function RQKEY(feedDesc, params) {
    return [RQKEY_ROOT, feedDesc, params || {}];
}
/**
 * The minimum number of posts we want in a single "page" of results. Since we
 * filter out unwanted content, we may fetch more than this number to ensure
 * that we get _at least_ this number.
 */
var MIN_POSTS = 30;
export function usePostFeedQuery(feedDesc, params, opts) {
    var _a, _b;
    var feedTuners = useFeedTuners(feedDesc);
    var moderationOpts = useModerationOpts();
    var preferences = usePreferencesQuery().data;
    /**
     * Load bearing: we need to await AA state or risk FOUC. This marginally
     * delays feeds, but AA state is fetched immediately on load and is then
     * available for the remainder of the session, so this delay only affects cold
     * loads. -esb
     */
    var enabled = (opts === null || opts === void 0 ? void 0 : opts.enabled) !== false && Boolean(moderationOpts) && Boolean(preferences);
    var userInterests = aggregateUserInterests(preferences);
    var followingPinnedIndex = (_b = (_a = preferences === null || preferences === void 0 ? void 0 : preferences.savedFeeds) === null || _a === void 0 ? void 0 : _a.findIndex(function (f) { return f.pinned && f.value === 'following'; })) !== null && _b !== void 0 ? _b : -1;
    var enableFollowingToDiscoverFallback = followingPinnedIndex === 0;
    var agent = useAgent();
    var lastRun = useRef(null);
    var isDiscover = feedDesc.includes(DISCOVER_FEED_URI);
    /**
     * The number of posts to fetch in a single request. Because we filter
     * unwanted content, we may over-fetch here to try and fill pages by
     * `MIN_POSTS`. But if you're doing this, ask @why if it's ok first.
     */
    var fetchLimit = MIN_POSTS;
    // Make sure this doesn't invalidate unless really needed.
    var selectArgs = React.useMemo(function () { return ({
        feedTuners: feedTuners,
        moderationOpts: moderationOpts,
        ignoreFilterFor: opts === null || opts === void 0 ? void 0 : opts.ignoreFilterFor,
        isDiscover: isDiscover,
    }); }, [feedTuners, moderationOpts, opts === null || opts === void 0 ? void 0 : opts.ignoreFilterFor, isDiscover]);
    var query = useInfiniteQuery({
        enabled: enabled,
        staleTime: STALE.INFINITY,
        queryKey: RQKEY(feedDesc, params),
        queryFn: function (_a) {
            return __awaiter(this, arguments, void 0, function (_b) {
                var _c, api, cursor, res;
                var pageParam = _b.pageParam;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            logger.debug('usePostFeedQuery', { feedDesc: feedDesc, cursor: pageParam === null || pageParam === void 0 ? void 0 : pageParam.cursor });
                            _c = pageParam
                                ? pageParam
                                : {
                                    api: createApi({
                                        feedDesc: feedDesc,
                                        feedParams: params || {},
                                        feedTuners: feedTuners,
                                        agent: agent,
                                        // Not in the query key because they don't change:
                                        userInterests: userInterests,
                                        // Not in the query key. Reacting to it switching isn't important:
                                        enableFollowingToDiscoverFallback: enableFollowingToDiscoverFallback,
                                    }),
                                    cursor: undefined,
                                }, api = _c.api, cursor = _c.cursor;
                            return [4 /*yield*/, api.fetch({ cursor: cursor, limit: fetchLimit })
                                /*
                                 * If this is a public view, we need to check if posts fail moderation.
                                 * If all fail, we throw an error. If only some fail, we continue and let
                                 * moderations happen later, which results in some posts being shown and
                                 * some not.
                                 */
                            ];
                        case 1:
                            res = _d.sent();
                            /*
                             * If this is a public view, we need to check if posts fail moderation.
                             * If all fail, we throw an error. If only some fail, we continue and let
                             * moderations happen later, which results in some posts being shown and
                             * some not.
                             */
                            if (!agent.session) {
                                assertSomePostsPassModeration(res.feed, (preferences === null || preferences === void 0 ? void 0 : preferences.moderationPrefs) ||
                                    DEFAULT_LOGGED_OUT_PREFERENCES.moderationPrefs);
                            }
                            return [2 /*return*/, {
                                    api: api,
                                    cursor: res.cursor,
                                    feed: res.feed,
                                    fetchedAt: Date.now(),
                                }];
                    }
                });
            });
        },
        initialPageParam: undefined,
        getNextPageParam: function (lastPage) {
            return lastPage.cursor
                ? {
                    api: lastPage.api,
                    cursor: lastPage.cursor,
                }
                : undefined;
        },
        select: useCallback(function (data) {
            // If the selection depends on some data, that data should
            // be included in the selectArgs object and read here.
            var feedTuners = selectArgs.feedTuners, moderationOpts = selectArgs.moderationOpts, ignoreFilterFor = selectArgs.ignoreFilterFor, isDiscover = selectArgs.isDiscover;
            var tuner = new FeedTuner(feedTuners);
            // Keep track of the last run and whether we can reuse
            // some already selected pages from there.
            var reusedPages = [];
            if (lastRun.current) {
                var _a = lastRun.current, lastData = _a.data, lastArgs = _a.args, lastResult = _a.result;
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
                            // Keep the tuner in sync so that the end result is deterministic.
                            tuner.tune(lastData.pages[i].feed);
                            continue;
                        }
                        // Stop as soon as pages stop matching up.
                        break;
                    }
                }
            }
            var result = {
                pageParams: data.pageParams,
                pages: __spreadArray(__spreadArray([], reusedPages, true), data.pages.slice(reusedPages.length).map(function (page) { return ({
                    api: page.api,
                    tuner: tuner,
                    cursor: page.cursor,
                    fetchedAt: page.fetchedAt,
                    slices: tuner
                        .tune(page.feed)
                        .map(function (slice) {
                        var _a;
                        var moderations = slice.items.map(function (item) {
                            return moderatePost(item.post, moderationOpts);
                        });
                        // apply moderation filter
                        for (var i = 0; i < slice.items.length; i++) {
                            var ignoreFilter = slice.items[i].post.author.did === ignoreFilterFor;
                            if (ignoreFilter) {
                                // remove mutes to avoid confused UIs
                                moderations[i].causes = moderations[i].causes.filter(function (cause) { return cause.type !== 'muted'; });
                            }
                            if (!ignoreFilter &&
                                ((_a = moderations[i]) === null || _a === void 0 ? void 0 : _a.ui('contentList').filter)) {
                                return undefined;
                            }
                        }
                        if (isDiscover) {
                            userActionHistory.seen(slice.items.map(function (item) {
                                var _a, _b, _c, _d;
                                return ({
                                    feedContext: slice.feedContext,
                                    reqId: slice.reqId,
                                    likeCount: (_a = item.post.likeCount) !== null && _a !== void 0 ? _a : 0,
                                    repostCount: (_b = item.post.repostCount) !== null && _b !== void 0 ? _b : 0,
                                    replyCount: (_c = item.post.replyCount) !== null && _c !== void 0 ? _c : 0,
                                    isFollowedBy: Boolean((_d = item.post.author.viewer) === null || _d === void 0 ? void 0 : _d.followedBy),
                                    uri: item.post.uri,
                                });
                            }));
                        }
                        var feedPostSlice = {
                            _reactKey: slice._reactKey,
                            _isFeedPostSlice: true,
                            isIncompleteThread: slice.isIncompleteThread,
                            isFallbackMarker: slice.isFallbackMarker,
                            feedContext: slice.feedContext,
                            reqId: slice.reqId,
                            reason: slice.reason,
                            feedPostUri: slice.feedPostUri,
                            items: slice.items.map(function (item, i) {
                                var feedPostSliceItem = {
                                    _reactKey: "".concat(slice._reactKey, "-").concat(i, "-").concat(item.post.uri),
                                    uri: item.post.uri,
                                    post: item.post,
                                    record: item.record,
                                    moderation: moderations[i],
                                    parentAuthor: item.parentAuthor,
                                    isParentBlocked: item.isParentBlocked,
                                    isParentNotFound: item.isParentNotFound,
                                };
                                return feedPostSliceItem;
                            }),
                        };
                        return feedPostSlice;
                    })
                        .filter(function (n) { return !!n; }),
                }); }), true),
            };
            // Save for memoization.
            lastRun.current = { data: data, result: result, args: selectArgs };
            return result;
        }, [selectArgs /* Don't change. Everything needs to go into selectArgs. */]),
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
            for (var _b = 0, _c = page.slices; _b < _c.length; _b++) {
                var slice = _c[_b];
                itemCount += slice.items.length;
            }
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
            wantedItemCount.current = MIN_POSTS;
        }
        else if (isFetchingNextPage) {
            if (itemCount > wantedItemCount.current) {
                // We have more items than wantedItemCount, so wantedItemCount must be out of date.
                // Some other code must have called fetchNextPage(), for example, from onEndReached.
                // Adjust the wantedItemCount to reflect that we want one more full page of items.
                wantedItemCount.current = itemCount + MIN_POSTS;
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
export function pollLatest(page) {
    return __awaiter(this, void 0, void 0, function () {
        var post, slices;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!page) {
                        return [2 /*return*/, false];
                    }
                    if (AppState.currentState !== 'active') {
                        return [2 /*return*/];
                    }
                    logger.debug('usePostFeedQuery: pollLatest');
                    return [4 /*yield*/, page.api.peekLatest()];
                case 1:
                    post = _a.sent();
                    if (post) {
                        slices = page.tuner.tune([post], {
                            dryRun: true,
                        });
                        if (slices[0]) {
                            return [2 /*return*/, true];
                        }
                    }
                    return [2 /*return*/, false];
            }
        });
    });
}
function createApi(_a) {
    var feedDesc = _a.feedDesc, feedParams = _a.feedParams, feedTuners = _a.feedTuners, userInterests = _a.userInterests, agent = _a.agent, enableFollowingToDiscoverFallback = _a.enableFollowingToDiscoverFallback;
    if (feedDesc === 'following') {
        if (feedParams.mergeFeedEnabled) {
            return new MergeFeedAPI({
                agent: agent,
                feedParams: feedParams,
                feedTuners: feedTuners,
                userInterests: userInterests,
            });
        }
        else {
            if (enableFollowingToDiscoverFallback) {
                return new HomeFeedAPI({ agent: agent, userInterests: userInterests });
            }
            else {
                return new FollowingFeedAPI({ agent: agent });
            }
        }
    }
    else if (feedDesc.startsWith('author')) {
        var _b = feedDesc.split('|'), __ = _b[0], actor = _b[1], filter = _b[2];
        return new AuthorFeedAPI({ agent: agent, feedParams: { actor: actor, filter: filter } });
    }
    else if (feedDesc.startsWith('likes')) {
        var _c = feedDesc.split('|'), __ = _c[0], actor = _c[1];
        return new LikesFeedAPI({ agent: agent, feedParams: { actor: actor } });
    }
    else if (feedDesc.startsWith('feedgen')) {
        var _d = feedDesc.split('|'), __ = _d[0], feed = _d[1];
        return new CustomFeedAPI({
            agent: agent,
            feedParams: { feed: feed },
            userInterests: userInterests,
        });
    }
    else if (feedDesc.startsWith('list')) {
        var _e = feedDesc.split('|'), __ = _e[0], list = _e[1];
        return new ListFeedAPI({ agent: agent, feedParams: { list: list } });
    }
    else if (feedDesc.startsWith('posts')) {
        var _f = feedDesc.split('|'), __ = _f[0], uriList = _f[1];
        return new PostListFeedAPI({ agent: agent, feedParams: { uris: uriList.split(',') } });
    }
    else if (feedDesc === 'demo') {
        return new DemoFeedAPI({ agent: agent });
    }
    else {
        // shouldnt happen
        return new FollowingFeedAPI({ agent: agent });
    }
}
export function findAllPostsInQueryData(queryClient, uri) {
    var atUri, queryDatas, _i, queryDatas_1, _a, _queryKey, queryData, _b, _c, page, _d, _e, item, quotedPost, parentQuotedPost, rootQuotedPost;
    var _f, _g;
    return __generator(this, function (_h) {
        switch (_h.label) {
            case 0:
                atUri = new AtUri(uri);
                queryDatas = queryClient.getQueriesData({
                    queryKey: [RQKEY_ROOT],
                });
                _i = 0, queryDatas_1 = queryDatas;
                _h.label = 1;
            case 1:
                if (!(_i < queryDatas_1.length)) return [3 /*break*/, 18];
                _a = queryDatas_1[_i], _queryKey = _a[0], queryData = _a[1];
                if (!(queryData === null || queryData === void 0 ? void 0 : queryData.pages)) {
                    return [3 /*break*/, 17];
                }
                _b = 0, _c = queryData === null || queryData === void 0 ? void 0 : queryData.pages;
                _h.label = 2;
            case 2:
                if (!(_b < _c.length)) return [3 /*break*/, 17];
                page = _c[_b];
                _d = 0, _e = page.feed;
                _h.label = 3;
            case 3:
                if (!(_d < _e.length)) return [3 /*break*/, 16];
                item = _e[_d];
                if (!didOrHandleUriMatches(atUri, item.post)) return [3 /*break*/, 5];
                return [4 /*yield*/, item.post];
            case 4:
                _h.sent();
                _h.label = 5;
            case 5:
                quotedPost = getEmbeddedPost(item.post.embed);
                if (!(quotedPost && didOrHandleUriMatches(atUri, quotedPost))) return [3 /*break*/, 7];
                return [4 /*yield*/, embedViewRecordToPostView(quotedPost)];
            case 6:
                _h.sent();
                _h.label = 7;
            case 7:
                if (!AppBskyFeedDefs.isPostView((_f = item.reply) === null || _f === void 0 ? void 0 : _f.parent)) return [3 /*break*/, 11];
                if (!didOrHandleUriMatches(atUri, item.reply.parent)) return [3 /*break*/, 9];
                return [4 /*yield*/, item.reply.parent];
            case 8:
                _h.sent();
                _h.label = 9;
            case 9:
                parentQuotedPost = getEmbeddedPost(item.reply.parent.embed);
                if (!(parentQuotedPost &&
                    didOrHandleUriMatches(atUri, parentQuotedPost))) return [3 /*break*/, 11];
                return [4 /*yield*/, embedViewRecordToPostView(parentQuotedPost)];
            case 10:
                _h.sent();
                _h.label = 11;
            case 11:
                if (!AppBskyFeedDefs.isPostView((_g = item.reply) === null || _g === void 0 ? void 0 : _g.root)) return [3 /*break*/, 15];
                if (!didOrHandleUriMatches(atUri, item.reply.root)) return [3 /*break*/, 13];
                return [4 /*yield*/, item.reply.root];
            case 12:
                _h.sent();
                _h.label = 13;
            case 13:
                rootQuotedPost = getEmbeddedPost(item.reply.root.embed);
                if (!(rootQuotedPost && didOrHandleUriMatches(atUri, rootQuotedPost))) return [3 /*break*/, 15];
                return [4 /*yield*/, embedViewRecordToPostView(rootQuotedPost)];
            case 14:
                _h.sent();
                _h.label = 15;
            case 15:
                _d++;
                return [3 /*break*/, 3];
            case 16:
                _b++;
                return [3 /*break*/, 2];
            case 17:
                _i++;
                return [3 /*break*/, 1];
            case 18: return [2 /*return*/];
        }
    });
}
export function findAllProfilesInQueryData(queryClient, did) {
    var queryDatas, _i, queryDatas_2, _a, _queryKey, queryData, _b, _c, page, _d, _e, item, quotedPost;
    var _f, _g, _h, _j, _k, _l;
    return __generator(this, function (_m) {
        switch (_m.label) {
            case 0:
                queryDatas = queryClient.getQueriesData({
                    queryKey: [RQKEY_ROOT],
                });
                _i = 0, queryDatas_2 = queryDatas;
                _m.label = 1;
            case 1:
                if (!(_i < queryDatas_2.length)) return [3 /*break*/, 14];
                _a = queryDatas_2[_i], _queryKey = _a[0], queryData = _a[1];
                if (!(queryData === null || queryData === void 0 ? void 0 : queryData.pages)) {
                    return [3 /*break*/, 13];
                }
                _b = 0, _c = queryData === null || queryData === void 0 ? void 0 : queryData.pages;
                _m.label = 2;
            case 2:
                if (!(_b < _c.length)) return [3 /*break*/, 13];
                page = _c[_b];
                _d = 0, _e = page.feed;
                _m.label = 3;
            case 3:
                if (!(_d < _e.length)) return [3 /*break*/, 12];
                item = _e[_d];
                if (!(item.post.author.did === did)) return [3 /*break*/, 5];
                return [4 /*yield*/, item.post.author];
            case 4:
                _m.sent();
                _m.label = 5;
            case 5:
                quotedPost = getEmbeddedPost(item.post.embed);
                if (!((quotedPost === null || quotedPost === void 0 ? void 0 : quotedPost.author.did) === did)) return [3 /*break*/, 7];
                return [4 /*yield*/, quotedPost.author];
            case 6:
                _m.sent();
                _m.label = 7;
            case 7:
                if (!(AppBskyFeedDefs.isPostView((_f = item.reply) === null || _f === void 0 ? void 0 : _f.parent) &&
                    ((_h = (_g = item.reply) === null || _g === void 0 ? void 0 : _g.parent) === null || _h === void 0 ? void 0 : _h.author.did) === did)) return [3 /*break*/, 9];
                return [4 /*yield*/, item.reply.parent.author];
            case 8:
                _m.sent();
                _m.label = 9;
            case 9:
                if (!(AppBskyFeedDefs.isPostView((_j = item.reply) === null || _j === void 0 ? void 0 : _j.root) &&
                    ((_l = (_k = item.reply) === null || _k === void 0 ? void 0 : _k.root) === null || _l === void 0 ? void 0 : _l.author.did) === did)) return [3 /*break*/, 11];
                return [4 /*yield*/, item.reply.root.author];
            case 10:
                _m.sent();
                _m.label = 11;
            case 11:
                _d++;
                return [3 /*break*/, 3];
            case 12:
                _b++;
                return [3 /*break*/, 2];
            case 13:
                _i++;
                return [3 /*break*/, 1];
            case 14: return [2 /*return*/];
        }
    });
}
function assertSomePostsPassModeration(feed, moderationPrefs) {
    // no posts in this feed
    if (feed.length === 0)
        return true;
    // assume false
    var somePostsPassModeration = false;
    for (var _i = 0, feed_1 = feed; _i < feed_1.length; _i++) {
        var item = feed_1[_i];
        var moderation = moderatePost(item.post, {
            userDid: undefined,
            prefs: moderationPrefs,
        });
        if (!moderation.ui('contentList').filter) {
            // we have a sfw post
            somePostsPassModeration = true;
        }
    }
    if (!somePostsPassModeration) {
        throw new Error(KnownError.FeedSignedInOnly);
    }
}
export function resetPostsFeedQueries(queryClient, timeout) {
    if (timeout === void 0) { timeout = 0; }
    setTimeout(function () {
        queryClient.resetQueries({
            predicate: function (query) { return query.queryKey[0] === RQKEY_ROOT; },
        });
    }, timeout);
}
export function resetProfilePostsQueries(queryClient, did, timeout) {
    if (timeout === void 0) { timeout = 0; }
    setTimeout(function () {
        queryClient.resetQueries({
            predicate: function (query) {
                var _a;
                return !!(query.queryKey[0] === RQKEY_ROOT &&
                    ((_a = query.queryKey[1]) === null || _a === void 0 ? void 0 : _a.includes(did)));
            },
        });
    }, timeout);
}
export function isFeedPostSlice(v) {
    return (v && typeof v === 'object' && '_isFeedPostSlice' in v && v._isFeedPostSlice);
}
