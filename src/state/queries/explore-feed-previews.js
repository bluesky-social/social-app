var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
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
import { useMemo, useRef } from 'react';
import { AppBskyFeedDefs, AtUri, moderatePost, } from '@atproto/api';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { useInfiniteQuery, } from '@tanstack/react-query';
import { CustomFeedAPI } from '#/lib/api/feed/custom';
import { aggregateUserInterests } from '#/lib/api/feed/utils';
import { FeedTuner } from '#/lib/api/feed-manip';
import { cleanError } from '#/lib/strings/errors';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { usePreferencesQuery } from '#/state/queries/preferences';
import { didOrHandleUriMatches, embedViewRecordToPostView, getEmbeddedPost, } from '#/state/queries/util';
import { useAgent } from '#/state/session';
var RQKEY_ROOT = 'feed-previews';
var RQKEY = function (feeds) { return [RQKEY_ROOT, feeds]; };
var LIMIT = 8; // sliced to 6, overfetch to account for moderation
var PINNED_POST_URIS = {
    // 📰 News
    'at://did:plc:kkf4naxqmweop7dv4l2iqqf5/app.bsky.feed.post/3lgh27w2ngc2b': true,
    // Gardening
    'at://did:plc:5rw2on4i56btlcajojaxwcat/app.bsky.feed.post/3kjorckgcwc27': true,
    // Web Development Trending
    'at://did:plc:m2sjv3wncvsasdapla35hzwj/app.bsky.feed.post/3lfaw445axs22': true,
    // Anime & Manga EN
    'at://did:plc:tazrmeme4dzahimsykusrwrk/app.bsky.feed.post/3knxx2gmkns2y': true,
    // 📽️ Film
    'at://did:plc:2hwwem55ce6djnk6bn62cstr/app.bsky.feed.post/3llhpzhbq7c2g': true,
    // PopSky
    'at://did:plc:lfdf4srj43iwdng7jn35tjsp/app.bsky.feed.post/3lbblgly65c2g': true,
    // Science
    'at://did:plc:hu2obebw3nhfj667522dahfg/app.bsky.feed.post/3kl33otd6ob2s': true,
    // Birds! 🦉
    'at://did:plc:ffkgesg3jsv2j7aagkzrtcvt/app.bsky.feed.post/3lbg4r57yk22d': true,
    // Astronomy
    'at://did:plc:xy2zorw2ys47poflotxthlzg/app.bsky.feed.post/3kyzye4lujs2w': true,
    // What's Cooking 🍽️
    'at://did:plc:geoqe3qls5mwezckxxsewys2/app.bsky.feed.post/3lfqhgvxbqc2q': true,
    // BookSky 💙📚 #booksky
    'at://did:plc:geoqe3qls5mwezckxxsewys2/app.bsky.feed.post/3kgrm2rw5ww2e': true,
};
export function useFeedPreviews(feedsMaybeWithDuplicates, isEnabled) {
    var _this = this;
    if (isEnabled === void 0) { isEnabled = true; }
    var feeds = useMemo(function () {
        return feedsMaybeWithDuplicates.filter(function (f, i, a) { return i === a.findIndex(function (f2) { return f.uri === f2.uri; }); });
    }, [feedsMaybeWithDuplicates]);
    var uris = feeds.map(function (feed) { return feed.uri; });
    var _ = useLingui()._;
    var agent = useAgent();
    var preferences = usePreferencesQuery().data;
    var userInterests = aggregateUserInterests(preferences);
    var moderationOpts = useModerationOpts();
    var enabled = feeds.length > 0 && isEnabled;
    var processedPageCache = useRef(new Map());
    var query = useInfiniteQuery({
        enabled: enabled,
        queryKey: RQKEY(uris),
        queryFn: function (_b) { return __awaiter(_this, [_b], void 0, function (_c) {
            var feed, api, data;
            var pageParam = _c.pageParam;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        feed = feeds[pageParam];
                        api = new CustomFeedAPI({
                            agent: agent,
                            feedParams: { feed: feed.uri },
                            userInterests: userInterests,
                        });
                        return [4 /*yield*/, api.fetch({ cursor: undefined, limit: LIMIT })];
                    case 1:
                        data = _d.sent();
                        return [2 /*return*/, {
                                feed: feed,
                                posts: data.feed,
                            }];
                }
            });
        }); },
        initialPageParam: 0,
        getNextPageParam: function (_p, _a, count) {
            return count < feeds.length ? count + 1 : undefined;
        },
    });
    var data = query.data, isFetched = query.isFetched, isError = query.isError, isPending = query.isPending, error = query.error;
    return {
        query: query,
        data: useMemo(function () {
            var _b, _c;
            var items = [];
            if (!enabled)
                return items;
            items.push({
                type: 'preview:spacer',
                key: 'spacer',
            });
            var isEmpty = !isPending && !((_b = data === null || data === void 0 ? void 0 : data.pages) === null || _b === void 0 ? void 0 : _b.some(function (page) { return page.posts.length; }));
            if (isFetched) {
                if (isError && isEmpty) {
                    items.push({
                        type: 'preview:error',
                        key: 'error',
                        message: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["An error occurred while fetching the feed."], ["An error occurred while fetching the feed."])))),
                        error: cleanError(error),
                    });
                }
                else if (isEmpty) {
                    items.push({
                        type: 'preview:empty',
                        key: 'empty',
                    });
                }
                else if (data) {
                    for (var pageIndex = 0; pageIndex < data.pages.length; pageIndex++) {
                        var page = data.pages[pageIndex];
                        var cachedPage = processedPageCache.current.get(page);
                        if (cachedPage) {
                            items.push.apply(items, cachedPage);
                            continue;
                        }
                        // default feed tuner - we just want it to slice up the feed
                        var tuner = new FeedTuner([]);
                        var slices = [];
                        var rowIndex = 0;
                        var _loop_1 = function (item) {
                            if (item.isFallbackMarker)
                                return "continue";
                            var moderations = item.items.map(function (item) {
                                return moderatePost(item.post, moderationOpts);
                            });
                            // apply moderation filters
                            item.items = item.items.filter(function (_, i) {
                                var _b;
                                return !((_b = moderations[i]) === null || _b === void 0 ? void 0 : _b.ui('contentList').filter);
                            });
                            var slice = {
                                _reactKey: page.feed.uri + item._reactKey,
                                _isFeedPostSlice: true,
                                isFallbackMarker: false,
                                isIncompleteThread: item.isIncompleteThread,
                                feedContext: item.feedContext,
                                reqId: item.reqId,
                                reason: item.reason,
                                feedPostUri: item.feedPostUri,
                                items: item.items
                                    .slice(0, 6)
                                    .filter(function (subItem) {
                                    return !PINNED_POST_URIS[subItem.post.uri];
                                })
                                    .map(function (subItem, i) {
                                    var feedPostSliceItem = {
                                        _reactKey: "".concat(item._reactKey, "-").concat(i, "-").concat(subItem.post.uri),
                                        uri: subItem.post.uri,
                                        post: subItem.post,
                                        record: subItem.record,
                                        moderation: moderations[i],
                                        parentAuthor: subItem.parentAuthor,
                                        isParentBlocked: subItem.isParentBlocked,
                                        isParentNotFound: subItem.isParentNotFound,
                                    };
                                    return feedPostSliceItem;
                                }),
                            };
                            if (slice.isIncompleteThread && slice.items.length >= 3) {
                                var beforeLast = slice.items.length - 2;
                                var last = slice.items.length - 1;
                                slices.push({
                                    type: 'preview:sliceItem',
                                    key: slice.items[0]._reactKey,
                                    slice: slice,
                                    indexInSlice: 0,
                                    feed: page.feed,
                                    showReplyTo: false,
                                    hideTopBorder: rowIndex === 0,
                                });
                                slices.push({
                                    type: 'preview:sliceViewFullThread',
                                    key: slice._reactKey + '-viewFullThread',
                                    uri: slice.items[0].uri,
                                });
                                slices.push({
                                    type: 'preview:sliceItem',
                                    key: slice.items[beforeLast]._reactKey,
                                    slice: slice,
                                    indexInSlice: beforeLast,
                                    feed: page.feed,
                                    showReplyTo: ((_c = slice.items[beforeLast].parentAuthor) === null || _c === void 0 ? void 0 : _c.did) !==
                                        slice.items[beforeLast].post.author.did,
                                    hideTopBorder: false,
                                });
                                slices.push({
                                    type: 'preview:sliceItem',
                                    key: slice.items[last]._reactKey,
                                    slice: slice,
                                    indexInSlice: last,
                                    feed: page.feed,
                                    showReplyTo: false,
                                    hideTopBorder: false,
                                });
                            }
                            else {
                                for (var i = 0; i < slice.items.length; i++) {
                                    slices.push({
                                        type: 'preview:sliceItem',
                                        key: slice.items[i]._reactKey,
                                        slice: slice,
                                        indexInSlice: i,
                                        feed: page.feed,
                                        showReplyTo: i === 0,
                                        hideTopBorder: i === 0 && rowIndex === 0,
                                    });
                                }
                            }
                            rowIndex++;
                        };
                        for (var _i = 0, _d = tuner.tune(page.posts); _i < _d.length; _i++) {
                            var item = _d[_i];
                            _loop_1(item);
                        }
                        var processedPage = void 0;
                        if (slices.length > 0) {
                            processedPage = __spreadArray(__spreadArray([
                                {
                                    type: 'preview:header',
                                    key: "header-".concat(page.feed.uri),
                                    feed: page.feed,
                                }
                            ], slices, true), [
                                {
                                    type: 'preview:footer',
                                    key: "footer-".concat(page.feed.uri),
                                },
                            ], false);
                        }
                        else {
                            processedPage = [];
                        }
                        processedPageCache.current.set(page, processedPage);
                        items.push.apply(items, processedPage);
                    }
                }
                else if (isError && !isEmpty) {
                    items.push({
                        type: 'preview:loadMoreError',
                        key: 'loadMoreError',
                    });
                }
            }
            else {
                items.push({
                    type: 'preview:loading',
                    key: 'loading',
                });
            }
            return items;
        }, [
            enabled,
            data,
            isFetched,
            isError,
            isPending,
            moderationOpts,
            _,
            error,
        ]),
    };
}
export function findAllPostsInQueryData(queryClient, uri) {
    var atUri, queryDatas, _i, queryDatas_1, _b, _queryKey, queryData, _c, _d, page, _e, _f, item, quotedPost, parentQuotedPost, rootQuotedPost;
    var _g, _h;
    return __generator(this, function (_j) {
        switch (_j.label) {
            case 0:
                atUri = new AtUri(uri);
                queryDatas = queryClient.getQueriesData({
                    queryKey: [RQKEY_ROOT],
                });
                _i = 0, queryDatas_1 = queryDatas;
                _j.label = 1;
            case 1:
                if (!(_i < queryDatas_1.length)) return [3 /*break*/, 18];
                _b = queryDatas_1[_i], _queryKey = _b[0], queryData = _b[1];
                if (!(queryData === null || queryData === void 0 ? void 0 : queryData.pages)) {
                    return [3 /*break*/, 17];
                }
                _c = 0, _d = queryData === null || queryData === void 0 ? void 0 : queryData.pages;
                _j.label = 2;
            case 2:
                if (!(_c < _d.length)) return [3 /*break*/, 17];
                page = _d[_c];
                _e = 0, _f = page.posts;
                _j.label = 3;
            case 3:
                if (!(_e < _f.length)) return [3 /*break*/, 16];
                item = _f[_e];
                if (!didOrHandleUriMatches(atUri, item.post)) return [3 /*break*/, 5];
                return [4 /*yield*/, item.post];
            case 4:
                _j.sent();
                _j.label = 5;
            case 5:
                quotedPost = getEmbeddedPost(item.post.embed);
                if (!(quotedPost && didOrHandleUriMatches(atUri, quotedPost))) return [3 /*break*/, 7];
                return [4 /*yield*/, embedViewRecordToPostView(quotedPost)];
            case 6:
                _j.sent();
                _j.label = 7;
            case 7:
                if (!AppBskyFeedDefs.isPostView((_g = item.reply) === null || _g === void 0 ? void 0 : _g.parent)) return [3 /*break*/, 11];
                if (!didOrHandleUriMatches(atUri, item.reply.parent)) return [3 /*break*/, 9];
                return [4 /*yield*/, item.reply.parent];
            case 8:
                _j.sent();
                _j.label = 9;
            case 9:
                parentQuotedPost = getEmbeddedPost(item.reply.parent.embed);
                if (!(parentQuotedPost &&
                    didOrHandleUriMatches(atUri, parentQuotedPost))) return [3 /*break*/, 11];
                return [4 /*yield*/, embedViewRecordToPostView(parentQuotedPost)];
            case 10:
                _j.sent();
                _j.label = 11;
            case 11:
                if (!AppBskyFeedDefs.isPostView((_h = item.reply) === null || _h === void 0 ? void 0 : _h.root)) return [3 /*break*/, 15];
                if (!didOrHandleUriMatches(atUri, item.reply.root)) return [3 /*break*/, 13];
                return [4 /*yield*/, item.reply.root];
            case 12:
                _j.sent();
                _j.label = 13;
            case 13:
                rootQuotedPost = getEmbeddedPost(item.reply.root.embed);
                if (!(rootQuotedPost && didOrHandleUriMatches(atUri, rootQuotedPost))) return [3 /*break*/, 15];
                return [4 /*yield*/, embedViewRecordToPostView(rootQuotedPost)];
            case 14:
                _j.sent();
                _j.label = 15;
            case 15:
                _e++;
                return [3 /*break*/, 3];
            case 16:
                _c++;
                return [3 /*break*/, 2];
            case 17:
                _i++;
                return [3 /*break*/, 1];
            case 18: return [2 /*return*/];
        }
    });
}
export function findAllProfilesInQueryData(queryClient, did) {
    var queryDatas, _i, queryDatas_2, _b, _queryKey, queryData, _c, _d, page, _e, _f, item, quotedPost;
    var _g, _h, _j, _k, _l, _m;
    return __generator(this, function (_o) {
        switch (_o.label) {
            case 0:
                queryDatas = queryClient.getQueriesData({
                    queryKey: [RQKEY_ROOT],
                });
                _i = 0, queryDatas_2 = queryDatas;
                _o.label = 1;
            case 1:
                if (!(_i < queryDatas_2.length)) return [3 /*break*/, 14];
                _b = queryDatas_2[_i], _queryKey = _b[0], queryData = _b[1];
                if (!(queryData === null || queryData === void 0 ? void 0 : queryData.pages)) {
                    return [3 /*break*/, 13];
                }
                _c = 0, _d = queryData === null || queryData === void 0 ? void 0 : queryData.pages;
                _o.label = 2;
            case 2:
                if (!(_c < _d.length)) return [3 /*break*/, 13];
                page = _d[_c];
                _e = 0, _f = page.posts;
                _o.label = 3;
            case 3:
                if (!(_e < _f.length)) return [3 /*break*/, 12];
                item = _f[_e];
                if (!(item.post.author.did === did)) return [3 /*break*/, 5];
                return [4 /*yield*/, item.post.author];
            case 4:
                _o.sent();
                _o.label = 5;
            case 5:
                quotedPost = getEmbeddedPost(item.post.embed);
                if (!((quotedPost === null || quotedPost === void 0 ? void 0 : quotedPost.author.did) === did)) return [3 /*break*/, 7];
                return [4 /*yield*/, quotedPost.author];
            case 6:
                _o.sent();
                _o.label = 7;
            case 7:
                if (!(AppBskyFeedDefs.isPostView((_g = item.reply) === null || _g === void 0 ? void 0 : _g.parent) &&
                    ((_j = (_h = item.reply) === null || _h === void 0 ? void 0 : _h.parent) === null || _j === void 0 ? void 0 : _j.author.did) === did)) return [3 /*break*/, 9];
                return [4 /*yield*/, item.reply.parent.author];
            case 8:
                _o.sent();
                _o.label = 9;
            case 9:
                if (!(AppBskyFeedDefs.isPostView((_k = item.reply) === null || _k === void 0 ? void 0 : _k.root) &&
                    ((_m = (_l = item.reply) === null || _l === void 0 ? void 0 : _l.root) === null || _m === void 0 ? void 0 : _m.author.did) === did)) return [3 /*break*/, 11];
                return [4 /*yield*/, item.reply.root.author];
            case 10:
                _o.sent();
                _o.label = 11;
            case 11:
                _e++;
                return [3 /*break*/, 3];
            case 12:
                _c++;
                return [3 /*break*/, 2];
            case 13:
                _i++;
                return [3 /*break*/, 1];
            case 14: return [2 /*return*/];
        }
    });
}
var templateObject_1;
