var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
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
import { AtUri, moderateFeedGenerator, RichText, } from '@atproto/api';
import { t } from '@lingui/core/macro';
import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient, } from '@tanstack/react-query';
import { DISCOVER_FEED_URI, DISCOVER_SAVED_FEED } from '#/lib/constants';
import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { sanitizeHandle } from '#/lib/strings/handles';
import { PERSISTED_QUERY_GCTIME, PERSISTED_QUERY_ROOT, STALE, } from '#/state/queries';
import { RQKEY as listQueryKey } from '#/state/queries/list';
import { usePreferencesQuery } from '#/state/queries/preferences';
import { useAgent, useSession } from '#/state/session';
import { router } from '#/routes';
import { useModerationOpts } from '../preferences/moderation-opts';
import { precacheResolvedUri } from './resolve-uri';
export function isFeedSourceFeedInfo(feed) {
    return feed.type === 'feed';
}
var feedSourceInfoQueryKeyRoot = 'getFeedSourceInfo';
export var feedSourceInfoQueryKey = function (_a) {
    var uri = _a.uri;
    return [
        feedSourceInfoQueryKeyRoot,
        uri,
    ];
};
var feedSourceNSIDs = {
    feed: 'app.bsky.feed.generator',
    list: 'app.bsky.graph.list',
};
export function hydrateFeedGenerator(view) {
    var _a, _b;
    var urip = new AtUri(view.uri);
    var collection = urip.collection === 'app.bsky.feed.generator' ? 'feed' : 'lists';
    var href = "/profile/".concat(urip.hostname, "/").concat(collection, "/").concat(urip.rkey);
    var route = router.matchPath(href);
    return {
        type: 'feed',
        view: view,
        uri: view.uri,
        feedDescriptor: "feedgen|".concat(view.uri),
        cid: view.cid,
        route: {
            href: href,
            name: route[0],
            params: route[1],
        },
        avatar: view.avatar,
        displayName: view.displayName
            ? sanitizeDisplayName(view.displayName)
            : t(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Feed by ", ""], ["Feed by ", ""])), sanitizeHandle(view.creator.handle, '@')),
        description: new RichText({
            text: view.description || '',
            facets: (_a = (view.descriptionFacets || [])) === null || _a === void 0 ? void 0 : _a.slice(),
        }),
        creatorDid: view.creator.did,
        creatorHandle: view.creator.handle,
        likeCount: view.likeCount,
        acceptsInteractions: view.acceptsInteractions,
        likeUri: (_b = view.viewer) === null || _b === void 0 ? void 0 : _b.like,
        contentMode: view.contentMode,
    };
}
export function hydrateList(view) {
    var _a;
    var urip = new AtUri(view.uri);
    var collection = urip.collection === 'app.bsky.feed.generator' ? 'feed' : 'lists';
    var href = "/profile/".concat(urip.hostname, "/").concat(collection, "/").concat(urip.rkey);
    var route = router.matchPath(href);
    return {
        type: 'list',
        view: view,
        uri: view.uri,
        feedDescriptor: "list|".concat(view.uri),
        route: {
            href: href,
            name: route[0],
            params: route[1],
        },
        cid: view.cid,
        avatar: view.avatar,
        description: new RichText({
            text: view.description || '',
            facets: (_a = (view.descriptionFacets || [])) === null || _a === void 0 ? void 0 : _a.slice(),
        }),
        creatorDid: view.creator.did,
        creatorHandle: view.creator.handle,
        displayName: view.name
            ? sanitizeDisplayName(view.name)
            : t(templateObject_2 || (templateObject_2 = __makeTemplateObject(["User List by ", ""], ["User List by ", ""])), sanitizeHandle(view.creator.handle, '@')),
        contentMode: undefined,
    };
}
export function getFeedTypeFromUri(uri) {
    var pathname = new AtUri(uri).pathname;
    return pathname.includes(feedSourceNSIDs.feed) ? 'feed' : 'list';
}
export function getAvatarTypeFromUri(uri) {
    return getFeedTypeFromUri(uri) === 'feed' ? 'algo' : 'list';
}
export function useFeedSourceInfoQuery(_a) {
    var _this = this;
    var uri = _a.uri;
    var type = getFeedTypeFromUri(uri);
    var agent = useAgent();
    return useQuery({
        staleTime: STALE.INFINITY,
        queryKey: feedSourceInfoQueryKey({ uri: uri }),
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var view, res, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(type === 'feed')) return [3 /*break*/, 2];
                        return [4 /*yield*/, agent.app.bsky.feed.getFeedGenerator({ feed: uri })];
                    case 1:
                        res = _a.sent();
                        view = hydrateFeedGenerator(res.data.view);
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, agent.app.bsky.graph.getList({
                            list: uri,
                            limit: 1,
                        })];
                    case 3:
                        res = _a.sent();
                        view = hydrateList(res.data.list);
                        _a.label = 4;
                    case 4: return [2 /*return*/, view];
                }
            });
        }); },
    });
}
// HACK
// the protocol doesn't yet tell us which feeds are personalized
// this list is used to filter out feed recommendations from logged out users
// for the ones we know need it
// -prf
export var KNOWN_AUTHED_ONLY_FEEDS = [
    'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/with-friends', // popular with friends, by bsky.app
    'at://did:plc:tenurhgjptubkk5zf5qhi3og/app.bsky.feed.generator/mutuals', // mutuals, by skyfeed
    'at://did:plc:tenurhgjptubkk5zf5qhi3og/app.bsky.feed.generator/only-posts', // only posts, by skyfeed
    'at://did:plc:wzsilnxf24ehtmmc3gssy5bu/app.bsky.feed.generator/mentions', // mentions, by flicknow
    'at://did:plc:q6gjnaw2blty4crticxkmujt/app.bsky.feed.generator/bangers', // my bangers, by jaz
    'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/mutuals', // mutuals, by bluesky
    'at://did:plc:q6gjnaw2blty4crticxkmujt/app.bsky.feed.generator/my-followers', // followers, by jaz
    'at://did:plc:vpkhqolt662uhesyj6nxm7ys/app.bsky.feed.generator/followpics', // the gram, by why
];
export function createGetPopularFeedsQueryKey(options) {
    return ['getPopularFeeds', options === null || options === void 0 ? void 0 : options.limit];
}
export function useGetPopularFeedsQuery(options) {
    var _this = this;
    var hasSession = useSession().hasSession;
    var agent = useAgent();
    var limit = (options === null || options === void 0 ? void 0 : options.limit) || 10;
    var preferences = usePreferencesQuery().data;
    var queryClient = useQueryClient();
    var moderationOpts = useModerationOpts();
    // Make sure this doesn't invalidate unless really needed.
    var selectArgs = useMemo(function () { return ({
        hasSession: hasSession,
        savedFeeds: (preferences === null || preferences === void 0 ? void 0 : preferences.savedFeeds) || [],
        moderationOpts: moderationOpts,
    }); }, [hasSession, preferences === null || preferences === void 0 ? void 0 : preferences.savedFeeds, moderationOpts]);
    var lastPageCountRef = useRef(0);
    var query = useInfiniteQuery({
        enabled: Boolean(moderationOpts) && (options === null || options === void 0 ? void 0 : options.enabled) !== false,
        queryKey: createGetPopularFeedsQueryKey(options),
        queryFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var res, _i, _c, feed, hydratedFeed;
            var pageParam = _b.pageParam;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0: return [4 /*yield*/, agent.app.bsky.unspecced.getPopularFeedGenerators({
                            limit: limit,
                            cursor: pageParam,
                        })
                        // precache feeds
                    ];
                    case 1:
                        res = _d.sent();
                        // precache feeds
                        for (_i = 0, _c = res.data.feeds; _i < _c.length; _i++) {
                            feed = _c[_i];
                            hydratedFeed = hydrateFeedGenerator(feed);
                            precacheFeed(queryClient, hydratedFeed);
                        }
                        return [2 /*return*/, res.data];
                }
            });
        }); },
        initialPageParam: undefined,
        getNextPageParam: function (lastPage) { return lastPage.cursor; },
        select: useCallback(function (data) {
            var savedFeeds = selectArgs.savedFeeds, hasSessionInner = selectArgs.hasSession, moderationOpts = selectArgs.moderationOpts;
            return __assign(__assign({}, data), { pages: data.pages.map(function (page) {
                    return __assign(__assign({}, page), { feeds: page.feeds.filter(function (feed) {
                            if (!hasSessionInner &&
                                KNOWN_AUTHED_ONLY_FEEDS.includes(feed.uri)) {
                                return false;
                            }
                            var alreadySaved = Boolean(savedFeeds === null || savedFeeds === void 0 ? void 0 : savedFeeds.find(function (f) {
                                return f.value === feed.uri;
                            }));
                            var decision = moderateFeedGenerator(feed, moderationOpts);
                            return !alreadySaved && !decision.ui('contentList').filter;
                        }) });
                }) });
        }, [selectArgs /* Don't change. Everything needs to go into selectArgs. */]),
    });
    useEffect(function () {
        var _a, _b;
        var isFetching = query.isFetching, hasNextPage = query.hasNextPage, data = query.data;
        if (isFetching || !hasNextPage) {
            return;
        }
        // avoid double-fires of fetchNextPage()
        if (lastPageCountRef.current !== 0 &&
            lastPageCountRef.current === ((_a = data === null || data === void 0 ? void 0 : data.pages) === null || _a === void 0 ? void 0 : _a.length)) {
            return;
        }
        // fetch next page if we haven't gotten a full page of content
        var count = 0;
        for (var _i = 0, _c = (data === null || data === void 0 ? void 0 : data.pages) || []; _i < _c.length; _i++) {
            var page = _c[_i];
            count += page.feeds.length;
        }
        if (count < limit && ((data === null || data === void 0 ? void 0 : data.pages.length) || 0) < 6) {
            query.fetchNextPage();
            lastPageCountRef.current = ((_b = data === null || data === void 0 ? void 0 : data.pages) === null || _b === void 0 ? void 0 : _b.length) || 0;
        }
    }, [query, limit]);
    return query;
}
export function useSearchPopularFeedsMutation() {
    var _this = this;
    var agent = useAgent();
    var moderationOpts = useModerationOpts();
    return useMutation({
        mutationFn: function (query) { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, agent.app.bsky.unspecced.getPopularFeedGenerators({
                            limit: 10,
                            query: query,
                        })];
                    case 1:
                        res = _a.sent();
                        if (moderationOpts) {
                            return [2 /*return*/, res.data.feeds.filter(function (feed) {
                                    var decision = moderateFeedGenerator(feed, moderationOpts);
                                    return !decision.ui('contentMedia').blur;
                                })];
                        }
                        return [2 /*return*/, res.data.feeds];
                }
            });
        }); },
    });
}
var popularFeedsSearchQueryKeyRoot = 'popularFeedsSearch';
export var createPopularFeedsSearchQueryKey = function (query) { return [
    popularFeedsSearchQueryKeyRoot,
    query,
]; };
export function usePopularFeedsSearch(_a) {
    var _this = this;
    var query = _a.query, enabled = _a.enabled;
    var agent = useAgent();
    var moderationOpts = useModerationOpts();
    var enabledInner = enabled !== null && enabled !== void 0 ? enabled : Boolean(moderationOpts);
    return useQuery({
        enabled: enabledInner,
        queryKey: createPopularFeedsSearchQueryKey(query),
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, agent.app.bsky.unspecced.getPopularFeedGenerators({
                            limit: 15,
                            query: query,
                        })];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, res.data.feeds];
                }
            });
        }); },
        placeholderData: keepPreviousData,
        select: function (data) {
            return data.filter(function (feed) {
                var decision = moderateFeedGenerator(feed, moderationOpts);
                return !decision.ui('contentMedia').blur;
            });
        },
    });
}
var PWI_DISCOVER_FEED_STUB = {
    type: 'feed',
    displayName: 'Discover',
    uri: DISCOVER_FEED_URI,
    feedDescriptor: "feedgen|".concat(DISCOVER_FEED_URI),
    route: {
        href: '/',
        name: 'Home',
        params: {},
    },
    cid: '',
    avatar: '',
    description: new RichText({ text: '' }),
    creatorDid: '',
    creatorHandle: '',
    likeCount: 0,
    likeUri: '',
    // ---
    savedFeed: __assign({ id: 'pwi-discover' }, DISCOVER_SAVED_FEED),
    contentMode: undefined,
};
var createPinnedFeedInfosQueryKeyRoot = function (kind, feedUris) { return [PERSISTED_QUERY_ROOT, 'feed-info', kind, feedUris]; };
export function usePinnedFeedsInfos() {
    var _this = this;
    var _a;
    var hasSession = useSession().hasSession;
    var agent = useAgent();
    var _b = usePreferencesQuery(), preferences = _b.data, isLoadingPrefs = _b.isLoading;
    var pinnedItems = (_a = preferences === null || preferences === void 0 ? void 0 : preferences.savedFeeds.filter(function (feed) { return feed.pinned; })) !== null && _a !== void 0 ? _a : [];
    return useQuery({
        queryKey: createPinnedFeedInfosQueryKeyRoot('pinned', pinnedItems.map(function (f) { return f.value; })),
        gcTime: PERSISTED_QUERY_GCTIME,
        staleTime: STALE.INFINITY,
        enabled: !isLoadingPrefs,
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var resolved, pinnedFeeds, feedsPromise, pinnedLists, listsPromises, result, _i, pinnedItems_1, pinnedItem, feedInfo;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!hasSession) {
                            return [2 /*return*/, [PWI_DISCOVER_FEED_STUB]];
                        }
                        resolved = new Map();
                        pinnedFeeds = pinnedItems.filter(function (feed) { return feed.type === 'feed'; });
                        feedsPromise = Promise.resolve();
                        if (pinnedFeeds.length > 0) {
                            feedsPromise = agent.app.bsky.feed
                                .getFeedGenerators({
                                feeds: pinnedFeeds.map(function (f) { return f.value; }),
                            })
                                .then(function (res) {
                                for (var i = 0; i < res.data.feeds.length; i++) {
                                    var feedView = res.data.feeds[i];
                                    resolved.set(feedView.uri, hydrateFeedGenerator(feedView));
                                }
                            });
                        }
                        pinnedLists = pinnedItems.filter(function (feed) { return feed.type === 'list'; });
                        listsPromises = pinnedLists.map(function (list) {
                            return agent.app.bsky.graph
                                .getList({
                                list: list.value,
                                limit: 1,
                            })
                                .then(function (res) {
                                var listView = res.data.list;
                                resolved.set(listView.uri, hydrateList(listView));
                            });
                        });
                        return [4 /*yield*/, feedsPromise]; // Fail the whole query if it fails.
                    case 1:
                        _a.sent(); // Fail the whole query if it fails.
                        return [4 /*yield*/, Promise.allSettled(listsPromises)
                            // order the feeds/lists in the order they were pinned
                        ]; // Ignore individual failing ones.
                    case 2:
                        _a.sent(); // Ignore individual failing ones.
                        result = [];
                        for (_i = 0, pinnedItems_1 = pinnedItems; _i < pinnedItems_1.length; _i++) {
                            pinnedItem = pinnedItems_1[_i];
                            feedInfo = resolved.get(pinnedItem.value);
                            if (feedInfo) {
                                result.push(__assign(__assign({}, feedInfo), { savedFeed: pinnedItem }));
                            }
                            else if (pinnedItem.type === 'timeline') {
                                result.push({
                                    type: 'feed',
                                    displayName: 'Following',
                                    uri: pinnedItem.value,
                                    feedDescriptor: 'following',
                                    route: {
                                        href: '/',
                                        name: 'Home',
                                        params: {},
                                    },
                                    cid: '',
                                    avatar: '',
                                    description: new RichText({ text: '' }),
                                    creatorDid: '',
                                    creatorHandle: '',
                                    likeCount: 0,
                                    likeUri: '',
                                    savedFeed: pinnedItem,
                                    contentMode: undefined,
                                });
                            }
                        }
                        return [2 /*return*/, result];
                }
            });
        }); },
    });
}
export function useSavedFeeds() {
    var _this = this;
    var _a;
    var agent = useAgent();
    var _b = usePreferencesQuery(), preferences = _b.data, isLoadingPrefs = _b.isLoading;
    var savedItems = (_a = preferences === null || preferences === void 0 ? void 0 : preferences.savedFeeds) !== null && _a !== void 0 ? _a : [];
    var queryClient = useQueryClient();
    return useQuery({
        queryKey: createPinnedFeedInfosQueryKeyRoot('saved', savedItems.map(function (f) { return f.value; })),
        gcTime: PERSISTED_QUERY_GCTIME,
        staleTime: STALE.INFINITY,
        enabled: !isLoadingPrefs,
        placeholderData: function (previousData) {
            return (previousData || {
                // The likely count before we try to resolve them.
                count: savedItems.length,
                feeds: [],
            });
        },
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var resolvedFeeds, resolvedLists, savedFeeds, savedLists, feedsPromise, listsPromises, result, _i, savedItems_1, savedItem, resolvedFeed, resolvedList;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        resolvedFeeds = new Map();
                        resolvedLists = new Map();
                        savedFeeds = savedItems.filter(function (feed) { return feed.type === 'feed'; });
                        savedLists = savedItems.filter(function (feed) { return feed.type === 'list'; });
                        feedsPromise = Promise.resolve();
                        if (savedFeeds.length > 0) {
                            feedsPromise = agent.app.bsky.feed
                                .getFeedGenerators({
                                feeds: savedFeeds.map(function (f) { return f.value; }),
                            })
                                .then(function (res) {
                                res.data.feeds.forEach(function (f) {
                                    resolvedFeeds.set(f.uri, f);
                                });
                            });
                        }
                        listsPromises = savedLists.map(function (list) {
                            return agent.app.bsky.graph
                                .getList({
                                list: list.value,
                                limit: 1,
                            })
                                .then(function (res) {
                                var listView = res.data.list;
                                resolvedLists.set(listView.uri, listView);
                            });
                        });
                        return [4 /*yield*/, Promise.allSettled(__spreadArray([feedsPromise], listsPromises, true))];
                    case 1:
                        _a.sent();
                        resolvedFeeds.forEach(function (feed) {
                            var hydratedFeed = hydrateFeedGenerator(feed);
                            precacheFeed(queryClient, hydratedFeed);
                        });
                        resolvedLists.forEach(function (list) {
                            precacheList(queryClient, list);
                        });
                        result = [];
                        for (_i = 0, savedItems_1 = savedItems; _i < savedItems_1.length; _i++) {
                            savedItem = savedItems_1[_i];
                            if (savedItem.type === 'timeline') {
                                result.push({
                                    type: 'timeline',
                                    config: savedItem,
                                    view: undefined,
                                });
                            }
                            else if (savedItem.type === 'feed') {
                                resolvedFeed = resolvedFeeds.get(savedItem.value);
                                if (resolvedFeed) {
                                    result.push({
                                        type: 'feed',
                                        config: savedItem,
                                        view: resolvedFeed,
                                    });
                                }
                            }
                            else if (savedItem.type === 'list') {
                                resolvedList = resolvedLists.get(savedItem.value);
                                if (resolvedList) {
                                    result.push({
                                        type: 'list',
                                        config: savedItem,
                                        view: resolvedList,
                                    });
                                }
                            }
                        }
                        return [2 /*return*/, {
                                // By this point we know the real count.
                                count: result.length,
                                feeds: result,
                            }];
                }
            });
        }); },
    });
}
var feedInfoQueryKeyRoot = 'feedInfo';
export function useFeedInfo(feedUri) {
    var _this = this;
    var agent = useAgent();
    return useQuery({
        staleTime: STALE.INFINITY,
        queryKey: [feedInfoQueryKeyRoot, feedUri],
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var res, feedSourceInfo;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!feedUri) {
                            return [2 /*return*/, null];
                        }
                        return [4 /*yield*/, agent.app.bsky.feed.getFeedGenerator({
                                feed: feedUri,
                            })];
                    case 1:
                        res = _a.sent();
                        feedSourceInfo = hydrateFeedGenerator(res.data.view);
                        return [2 /*return*/, feedSourceInfo];
                }
            });
        }); },
    });
}
function precacheFeed(queryClient, hydratedFeed) {
    precacheResolvedUri(queryClient, hydratedFeed.creatorHandle, hydratedFeed.creatorDid);
    queryClient.setQueryData(feedSourceInfoQueryKey({ uri: hydratedFeed.uri }), hydratedFeed);
}
export function precacheList(queryClient, list) {
    precacheResolvedUri(queryClient, list.creator.handle, list.creator.did);
    queryClient.setQueryData(listQueryKey(list.uri), list);
}
export function precacheFeedFromGeneratorView(queryClient, view) {
    var hydratedFeed = hydrateFeedGenerator(view);
    precacheFeed(queryClient, hydratedFeed);
}
var templateObject_1, templateObject_2;
