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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useQueryClient } from '@tanstack/react-query';
import * as bcp47Match from 'bcp-47-match';
import { popularInterests, useInterestsDisplayNames } from '#/lib/interests';
import { cleanError } from '#/lib/strings/errors';
import { sanitizeHandle } from '#/lib/strings/handles';
import { useLanguagePrefs } from '#/state/preferences/languages';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { RQKEY_ROOT as useActorSearchQueryKeyRoot } from '#/state/queries/actor-search';
import { useFeedPreviews, } from '#/state/queries/explore-feed-previews';
import { useGetPopularFeedsQuery } from '#/state/queries/feed';
import { Nux, useNux } from '#/state/queries/nuxs';
import { usePreferencesQuery } from '#/state/queries/preferences';
import { createGetSuggestedFeedsQueryKey, useGetSuggestedFeedsQuery, } from '#/state/queries/trending/useGetSuggestedFeedsQuery';
import { getSuggestedUsersQueryKeyRoot } from '#/state/queries/trending/useGetSuggestedUsersQuery';
import { createGetTrendsQueryKey } from '#/state/queries/trending/useGetTrendsQuery';
import { createSuggestedStarterPacksQueryKey, useSuggestedStarterPacksQuery, } from '#/state/queries/useSuggestedStarterPacksQuery';
import { isThreadChildAt, isThreadParentAt } from '#/view/com/posts/PostFeed';
import { PostFeedItem } from '#/view/com/posts/PostFeedItem';
import { ViewFullThread } from '#/view/com/posts/ViewFullThread';
import { List } from '#/view/com/util/List';
import { FeedFeedLoadingPlaceholder } from '#/view/com/util/LoadingPlaceholder';
import { LoadMoreRetryBtn } from '#/view/com/util/LoadMoreRetryBtn';
import { StarterPackCard, StarterPackCardSkeleton, } from '#/screens/Search/components/StarterPackCard';
import { ExploreInterestsCard } from '#/screens/Search/modules/ExploreInterestsCard';
import { ExploreRecommendations } from '#/screens/Search/modules/ExploreRecommendations';
import { ExploreTrendingTopics } from '#/screens/Search/modules/ExploreTrendingTopics';
import { ExploreTrendingVideos } from '#/screens/Search/modules/ExploreTrendingVideos';
import { useSuggestedUsers } from '#/screens/Search/util/useSuggestedUsers';
import { atoms as a, native, platform, useTheme } from '#/alf';
import { Admonition } from '#/components/Admonition';
import { Button } from '#/components/Button';
import * as FeedCard from '#/components/FeedCard';
import { ChevronBottom_Stroke2_Corner0_Rounded as ChevronDownIcon } from '#/components/icons/Chevron';
import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfo } from '#/components/icons/CircleInfo';
import { ListSparkle_Stroke2_Corner0_Rounded as ListSparkle } from '#/components/icons/ListSparkle';
import { StarterPack } from '#/components/icons/StarterPack';
import { UserCircle_Stroke2_Corner0_Rounded as Person } from '#/components/icons/UserCircle';
import { boostInterests } from '#/components/InterestTabs';
import { Loader } from '#/components/Loader';
import * as ProfileCard from '#/components/ProfileCard';
import { SubtleHover } from '#/components/SubtleHover';
import { Text } from '#/components/Typography';
import { useAnalytics } from '#/analytics';
import { ExploreScreenLiveEventFeedsBanner } from '#/features/liveEvents/components/ExploreScreenLiveEventFeedsBanner';
import * as ModuleHeader from './components/ModuleHeader';
import { SuggestedAccountsTabBar, SuggestedProfileCard, } from './modules/ExploreSuggestedAccounts';
function LoadMore(_a) {
    var item = _a.item;
    var t = useTheme();
    var _ = useLingui()._;
    var handleOnPress = function () {
        void item.onLoadMore();
    };
    return (_jsx(Button, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Load more"], ["Load more"])))), onPress: handleOnPress, style: [a.relative, a.w_full], children: function (_a) {
            var hovered = _a.hovered, pressed = _a.pressed;
            return (_jsxs(_Fragment, { children: [_jsx(SubtleHover, { hover: hovered || pressed }), _jsxs(View, { style: [
                            a.flex_1,
                            a.flex_row,
                            a.align_center,
                            a.justify_center,
                            a.px_lg,
                            a.py_md,
                            a.gap_sm,
                        ], children: [_jsx(Text, { style: [a.leading_snug], children: item.message }), item.isLoadingMore ? (_jsx(Loader, { size: "sm" })) : (_jsx(ChevronDownIcon, { size: "sm", style: t.atoms.text_contrast_medium }))] })] }));
        } }));
}
export function Explore(_a) {
    var _this = this;
    var _b, _c, _d;
    var focusSearchInput = _a.focusSearchInput;
    var ax = useAnalytics();
    var _ = useLingui()._;
    var t = useTheme();
    var _e = usePreferencesQuery(), preferences = _e.data, preferencesError = _e.error;
    var moderationOpts = useModerationOpts();
    var _f = useState(null), selectedInterest = _f[0], setSelectedInterest = _f[1];
    /*
     * Begin special language handling
     */
    var contentLanguages = useLanguagePrefs().contentLanguages;
    var useFullExperience = useMemo(function () {
        if (contentLanguages.length === 0)
            return true;
        return bcp47Match.basicFilter('en', contentLanguages).length > 0;
    }, [contentLanguages]);
    var personalizedInterests = (_b = preferences === null || preferences === void 0 ? void 0 : preferences.interests) === null || _b === void 0 ? void 0 : _b.tags;
    var interestsDisplayNames = useInterestsDisplayNames();
    var interests = Object.keys(interestsDisplayNames)
        .sort(boostInterests(popularInterests))
        .sort(boostInterests(personalizedInterests));
    var _g = useSuggestedUsers({
        category: selectedInterest || (useFullExperience ? null : interests[0]),
        search: !useFullExperience,
    }), suggestedUsers = _g.data, suggestedUsersIsLoading = _g.isLoading, suggestedUsersError = _g.error, suggestedUsersIsRefetching = _g.isRefetching;
    /* End special language handling */
    var _h = useGetPopularFeedsQuery({ limit: 10, enabled: useFullExperience }), feeds = _h.data, hasNextFeedsPage = _h.hasNextPage, isLoadingFeeds = _h.isLoading, isFetchingNextFeedsPage = _h.isFetchingNextPage, feedsError = _h.error, fetchNextFeedsPage = _h.fetchNextPage;
    var interestsNux = useNux(Nux.ExploreInterestsCard);
    var showInterestsNux = interestsNux.status === 'ready' && !((_c = interestsNux.nux) === null || _c === void 0 ? void 0 : _c.completed);
    var _j = useSuggestedStarterPacksQuery({ enabled: useFullExperience }), suggestedSPs = _j.data, isLoadingSuggestedSPs = _j.isLoading, suggestedSPsError = _j.error, isRefetchingSuggestedSPs = _j.isRefetching;
    var isLoadingMoreFeeds = isFetchingNextFeedsPage && !isLoadingFeeds;
    var _k = useState(false), hasPressedLoadMoreFeeds = _k[0], setHasPressedLoadMoreFeeds = _k[1];
    var onLoadMoreFeeds = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (isFetchingNextFeedsPage || !hasNextFeedsPage || feedsError)
                        return [2 /*return*/];
                    if (!hasPressedLoadMoreFeeds) {
                        setHasPressedLoadMoreFeeds(true);
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fetchNextFeedsPage()];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    ax.logger.error('Failed to load more suggested follows', { message: err_1 });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [
        ax,
        isFetchingNextFeedsPage,
        hasNextFeedsPage,
        feedsError,
        fetchNextFeedsPage,
        hasPressedLoadMoreFeeds,
    ]);
    var _l = useGetSuggestedFeedsQuery({
        enabled: useFullExperience,
    }), suggestedFeeds = _l.data, suggestedFeedsError = _l.error;
    var _m = useFeedPreviews((_d = suggestedFeeds === null || suggestedFeeds === void 0 ? void 0 : suggestedFeeds.feeds) !== null && _d !== void 0 ? _d : [], useFullExperience), feedPreviewSlices = _m.data, _o = _m.query, isPendingFeedPreviews = _o.isPending, isFetchingNextPageFeedPreviews = _o.isFetchingNextPage, fetchNextPageFeedPreviews = _o.fetchNextPage, hasNextPageFeedPreviews = _o.hasNextPage, feedPreviewSlicesError = _o.error;
    var qc = useQueryClient();
    var _p = useState(false), isPTR = _p[0], setIsPTR = _p[1];
    var onPTR = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsPTR(true);
                    return [4 /*yield*/, Promise.all([
                            qc.resetQueries({
                                queryKey: createGetTrendsQueryKey(),
                            }),
                            qc.resetQueries({
                                queryKey: createSuggestedStarterPacksQueryKey(),
                            }),
                            qc.resetQueries({
                                queryKey: [getSuggestedUsersQueryKeyRoot],
                            }),
                            qc.resetQueries({
                                queryKey: [useActorSearchQueryKeyRoot],
                            }),
                            qc.resetQueries({
                                queryKey: createGetSuggestedFeedsQueryKey(),
                            }),
                        ])];
                case 1:
                    _a.sent();
                    setIsPTR(false);
                    return [2 /*return*/];
            }
        });
    }); }, [qc, setIsPTR]);
    var onLoadMoreFeedPreviews = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (isPendingFeedPreviews ||
                        isFetchingNextPageFeedPreviews ||
                        !hasNextPageFeedPreviews ||
                        feedPreviewSlicesError)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fetchNextPageFeedPreviews()];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    err_2 = _a.sent();
                    ax.logger.error('Failed to load more feed previews', { message: err_2 });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [
        ax,
        isPendingFeedPreviews,
        isFetchingNextPageFeedPreviews,
        hasNextPageFeedPreviews,
        feedPreviewSlicesError,
        fetchNextPageFeedPreviews,
    ]);
    var topBorder = useMemo(function () {
        return ({
            type: 'topBorder',
            key: 'top-border',
        });
    }, []);
    var trendingTopicsModule = useMemo(function () {
        return ({
            type: 'trendingTopics',
            key: 'trending-topics',
        });
    }, []);
    var suggestedFollowsModule = useMemo(function () {
        var _a;
        var i = [];
        i.push({
            type: 'tabbedHeader',
            key: 'suggested-accounts-header',
            title: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Suggested accounts"], ["Suggested accounts"])))),
            icon: Person,
            searchButton: {
                label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Search for more accounts"], ["Search for more accounts"])))),
                metricsTag: 'suggestedAccounts',
                tab: 'user',
            },
            hideDefaultTab: !useFullExperience,
        });
        if (suggestedUsersIsLoading || suggestedUsersIsRefetching) {
            i.push({ type: 'profilePlaceholder', key: 'profilePlaceholder' });
        }
        else if (suggestedUsersError) {
            i.push({
                type: 'error',
                key: 'suggestedUsersError',
                message: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Failed to load suggested follows"], ["Failed to load suggested follows"])))),
                error: cleanError(suggestedUsersError),
            });
        }
        else {
            if (suggestedUsers !== undefined) {
                if (suggestedUsers.actors.length > 0 && moderationOpts) {
                    // Currently the responses contain duplicate items.
                    // Needs to be fixed on backend, but let's dedupe to be safe.
                    var seen = new Set();
                    var profileItems = [];
                    for (var _i = 0, _b = suggestedUsers.actors; _i < _b.length; _i++) {
                        var actor = _b[_i];
                        // checking for following still necessary if search data is used
                        if (!seen.has(actor.did) && !((_a = actor.viewer) === null || _a === void 0 ? void 0 : _a.following)) {
                            seen.add(actor.did);
                            profileItems.push({
                                type: 'profile',
                                key: actor.did,
                                profile: actor,
                            });
                        }
                    }
                    if (profileItems.length === 0) {
                        i.push({
                            type: 'profileEmpty',
                            key: 'profileEmpty',
                        });
                    }
                    else {
                        if (selectedInterest === null && useFullExperience) {
                            // First "For You" tab, only show 5 to keep screen short
                            i.push.apply(i, profileItems.slice(0, 5));
                        }
                        else {
                            i.push.apply(i, profileItems);
                        }
                    }
                }
                else {
                    i.push({
                        type: 'profileEmpty',
                        key: 'profileEmpty',
                    });
                }
            }
            else {
                i.push({ type: 'profilePlaceholder', key: 'profilePlaceholder' });
            }
        }
        return i;
    }, [
        _,
        moderationOpts,
        suggestedUsers,
        suggestedUsersIsLoading,
        suggestedUsersIsRefetching,
        suggestedUsersError,
        selectedInterest,
        useFullExperience,
    ]);
    var suggestedFeedsModule = useMemo(function () {
        var i = [];
        i.push({
            type: 'header',
            key: 'suggested-feeds-header',
            title: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Discover new feeds"], ["Discover new feeds"])))),
            icon: ListSparkle,
            searchButton: {
                label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Search for more feeds"], ["Search for more feeds"])))),
                metricsTag: 'suggestedFeeds',
                tab: 'feed',
            },
        });
        if (useFullExperience) {
            if (suggestedFeeds && preferences) {
                var seen = new Set();
                var feedItems = [];
                for (var _i = 0, _a = suggestedFeeds.feeds; _i < _a.length; _i++) {
                    var feed = _a[_i];
                    if (!seen.has(feed.uri)) {
                        seen.add(feed.uri);
                        feedItems.push({
                            type: 'feed',
                            key: feed.uri,
                            feed: feed,
                        });
                    }
                }
                // feeds errors can occur during pagination, so feeds is truthy
                if (suggestedFeedsError) {
                    i.push({
                        type: 'error',
                        key: 'suggestedFeedsError',
                        message: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Failed to load suggested feeds"], ["Failed to load suggested feeds"])))),
                        error: cleanError(suggestedFeedsError),
                    });
                }
                else if (preferencesError) {
                    i.push({
                        type: 'error',
                        key: 'preferencesError',
                        message: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Failed to load feeds preferences"], ["Failed to load feeds preferences"])))),
                        error: cleanError(preferencesError),
                    });
                }
                else {
                    if (feedItems.length === 0) {
                        i.pop();
                    }
                    else {
                        // This query doesn't follow the limit very well, so the first press of the
                        // load more button just unslices the array back to ~10 items
                        if (!hasPressedLoadMoreFeeds) {
                            i.push.apply(i, feedItems.slice(0, 6));
                        }
                        else {
                            i.push.apply(i, feedItems);
                        }
                        for (var _b = 0, _c = feedItems.entries(); _b < _c.length; _b++) {
                            var _d = _c[_b], index = _d[0], item = _d[1];
                            if (item.type !== 'feed') {
                                continue;
                            }
                            // don't log the ones we've already sent
                            if (hasPressedLoadMoreFeeds && index < 6) {
                                continue;
                            }
                            ax.metric('feed:suggestion:seen', { feedUrl: item.feed.uri });
                        }
                    }
                    if (!hasPressedLoadMoreFeeds) {
                        i.push({
                            type: 'loadMore',
                            key: 'loadMoreFeeds',
                            message: _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Load more suggested feeds"], ["Load more suggested feeds"])))),
                            isLoadingMore: isLoadingMoreFeeds,
                            onLoadMore: onLoadMoreFeeds,
                        });
                    }
                }
            }
            else {
                if (feedsError) {
                    i.push({
                        type: 'error',
                        key: 'feedsError',
                        message: _(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["Failed to load feeds"], ["Failed to load feeds"])))),
                        error: cleanError(feedsError),
                    });
                }
                else if (suggestedFeedsError) {
                    i.push({
                        type: 'error',
                        key: 'suggestedFeedsError',
                        message: _(msg(templateObject_11 || (templateObject_11 = __makeTemplateObject(["Failed to load suggested feeds"], ["Failed to load suggested feeds"])))),
                        error: cleanError(suggestedFeedsError),
                    });
                }
                else if (preferencesError) {
                    i.push({
                        type: 'error',
                        key: 'preferencesError',
                        message: _(msg(templateObject_12 || (templateObject_12 = __makeTemplateObject(["Failed to load feeds preferences"], ["Failed to load feeds preferences"])))),
                        error: cleanError(preferencesError),
                    });
                }
                else {
                    i.push({ type: 'feedPlaceholder', key: 'feedPlaceholder' });
                }
            }
        }
        else {
            if (feeds && preferences) {
                // Currently the responses contain duplicate items.
                // Needs to be fixed on backend, but let's dedupe to be safe.
                var seen = new Set();
                var feedItems = [];
                for (var _e = 0, _f = feeds.pages; _e < _f.length; _e++) {
                    var page = _f[_e];
                    for (var _g = 0, _h = page.feeds; _g < _h.length; _g++) {
                        var feed = _h[_g];
                        if (!seen.has(feed.uri)) {
                            seen.add(feed.uri);
                            feedItems.push({
                                type: 'feed',
                                key: feed.uri,
                                feed: feed,
                            });
                        }
                    }
                }
                // feeds errors can occur during pagination, so feeds is truthy
                if (feedsError) {
                    i.push({
                        type: 'error',
                        key: 'feedsError',
                        message: _(msg(templateObject_13 || (templateObject_13 = __makeTemplateObject(["Failed to load feeds"], ["Failed to load feeds"])))),
                        error: cleanError(feedsError),
                    });
                }
                else if (suggestedFeedsError) {
                    i.push({
                        type: 'error',
                        key: 'suggestedFeedsError',
                        message: _(msg(templateObject_14 || (templateObject_14 = __makeTemplateObject(["Failed to load suggested feeds"], ["Failed to load suggested feeds"])))),
                        error: cleanError(suggestedFeedsError),
                    });
                }
                else if (preferencesError) {
                    i.push({
                        type: 'error',
                        key: 'preferencesError',
                        message: _(msg(templateObject_15 || (templateObject_15 = __makeTemplateObject(["Failed to load feeds preferences"], ["Failed to load feeds preferences"])))),
                        error: cleanError(preferencesError),
                    });
                }
                else {
                    if (feedItems.length === 0) {
                        if (!hasNextFeedsPage) {
                            i.pop();
                        }
                    }
                    else {
                        // This query doesn't follow the limit very well, so the first press of the
                        // load more button just unslices the array back to ~10 items
                        if (!hasPressedLoadMoreFeeds) {
                            i.push.apply(i, feedItems.slice(0, 3));
                        }
                        else {
                            i.push.apply(i, feedItems);
                        }
                    }
                    if (hasNextFeedsPage) {
                        i.push({
                            type: 'loadMore',
                            key: 'loadMoreFeeds',
                            message: _(msg(templateObject_16 || (templateObject_16 = __makeTemplateObject(["Load more suggested feeds"], ["Load more suggested feeds"])))),
                            isLoadingMore: isLoadingMoreFeeds,
                            onLoadMore: onLoadMoreFeeds,
                        });
                    }
                }
            }
            else {
                if (feedsError) {
                    i.push({
                        type: 'error',
                        key: 'feedsError',
                        message: _(msg(templateObject_17 || (templateObject_17 = __makeTemplateObject(["Failed to load feeds"], ["Failed to load feeds"])))),
                        error: cleanError(feedsError),
                    });
                }
                else if (suggestedFeedsError) {
                    i.push({
                        type: 'error',
                        key: 'feedsError',
                        message: _(msg(templateObject_18 || (templateObject_18 = __makeTemplateObject(["Failed to load suggested feeds"], ["Failed to load suggested feeds"])))),
                        error: cleanError(suggestedFeedsError),
                    });
                }
                else if (preferencesError) {
                    i.push({
                        type: 'error',
                        key: 'preferencesError',
                        message: _(msg(templateObject_19 || (templateObject_19 = __makeTemplateObject(["Failed to load feeds preferences"], ["Failed to load feeds preferences"])))),
                        error: cleanError(preferencesError),
                    });
                }
                else {
                    i.push({ type: 'feedPlaceholder', key: 'feedPlaceholder' });
                }
            }
        }
        return i;
    }, [
        _,
        ax,
        useFullExperience,
        suggestedFeeds,
        preferences,
        suggestedFeedsError,
        preferencesError,
        feedsError,
        hasNextFeedsPage,
        hasPressedLoadMoreFeeds,
        isLoadingMoreFeeds,
        onLoadMoreFeeds,
        feeds,
    ]);
    var suggestedStarterPacksModule = useMemo(function () {
        var i = [];
        i.push({
            type: 'header',
            key: 'suggested-starterPacks-header',
            title: _(msg(templateObject_20 || (templateObject_20 = __makeTemplateObject(["Starter Packs"], ["Starter Packs"])))),
            icon: StarterPack,
            iconSize: 'xl',
        });
        if (isLoadingSuggestedSPs || isRefetchingSuggestedSPs) {
            Array.from({ length: 3 }).forEach(function (__, index) {
                return i.push({
                    type: 'starterPackSkeleton',
                    key: "starterPackSkeleton-".concat(index),
                });
            });
        }
        else if (suggestedSPsError || !suggestedSPs) {
            // just get rid of the section
            i.pop();
        }
        else {
            suggestedSPs.starterPacks.map(function (s) {
                i.push({
                    type: 'starterPack',
                    key: s.uri,
                    view: s,
                });
            });
        }
        return i;
    }, [
        suggestedSPs,
        _,
        isLoadingSuggestedSPs,
        suggestedSPsError,
        isRefetchingSuggestedSPs,
    ]);
    var feedPreviewsModule = useMemo(function () {
        var i = [];
        i.push.apply(i, feedPreviewSlices);
        if (isFetchingNextPageFeedPreviews) {
            i.push({
                type: 'preview:loading',
                key: 'preview-loading-more',
            });
        }
        return i;
    }, [feedPreviewSlices, isFetchingNextPageFeedPreviews]);
    var interestsNuxModule = useMemo(function () {
        if (!showInterestsNux)
            return [];
        return [
            {
                type: 'interests-card',
                key: 'interests-card',
            },
        ];
    }, [showInterestsNux]);
    var items = useMemo(function () {
        var i = [];
        // Dynamic module ordering
        i.push(topBorder);
        i.push.apply(i, interestsNuxModule);
        i.push({ type: 'liveEventFeedsBanner', key: 'liveEventFeedsBanner' });
        if (useFullExperience) {
            i.push(trendingTopicsModule);
            i.push.apply(i, suggestedFeedsModule);
            i.push.apply(i, suggestedFollowsModule);
            i.push.apply(i, suggestedStarterPacksModule);
            i.push.apply(i, feedPreviewsModule);
        }
        else {
            i.push.apply(i, suggestedFollowsModule);
        }
        return i;
    }, [
        topBorder,
        suggestedFollowsModule,
        suggestedStarterPacksModule,
        suggestedFeedsModule,
        trendingTopicsModule,
        feedPreviewsModule,
        interestsNuxModule,
        useFullExperience,
    ]);
    var renderItem = useCallback(function (_a) {
        var item = _a.item, index = _a.index;
        var handleOnPressRetry = function () {
            void fetchNextPageFeedPreviews();
        };
        switch (item.type) {
            case 'topBorder':
                return (_jsx(View, { style: [a.w_full, t.atoms.border_contrast_low, a.border_t] }));
            case 'header': {
                return (_jsxs(ModuleHeader.Container, { bottomBorder: item.bottomBorder, children: [_jsx(ModuleHeader.Icon, { icon: item.icon, size: item.iconSize }), _jsx(ModuleHeader.TitleText, { children: item.title }), item.searchButton && (_jsx(ModuleHeader.SearchButton, __assign({}, item.searchButton, { onPress: function () { var _a; return focusSearchInput(((_a = item.searchButton) === null || _a === void 0 ? void 0 : _a.tab) || 'user'); } })))] }));
            }
            case 'tabbedHeader': {
                return (_jsxs(View, { style: [a.pb_md], children: [_jsxs(ModuleHeader.Container, { style: [a.pb_xs], children: [_jsx(ModuleHeader.Icon, { icon: item.icon }), _jsx(ModuleHeader.TitleText, { children: item.title }), item.searchButton && (_jsx(ModuleHeader.SearchButton, __assign({}, item.searchButton, { onPress: function () { var _a; return focusSearchInput(((_a = item.searchButton) === null || _a === void 0 ? void 0 : _a.tab) || 'user'); } })))] }), _jsx(SuggestedAccountsTabBar, { selectedInterest: selectedInterest, onSelectInterest: setSelectedInterest, hideDefaultTab: item.hideDefaultTab })] }));
            }
            case 'trendingTopics': {
                return (_jsx(View, { style: [a.pb_md], children: _jsx(ExploreTrendingTopics, {}) }));
            }
            case 'trendingVideos': {
                return _jsx(ExploreTrendingVideos, {});
            }
            case 'recommendations': {
                return _jsx(ExploreRecommendations, {});
            }
            case 'profile': {
                return (_jsx(SuggestedProfileCard, { profile: item.profile, moderationOpts: moderationOpts, recId: item.recId, position: index }));
            }
            case 'profileEmpty': {
                return (_jsx(View, { style: [a.px_lg, a.pb_lg], children: _jsx(Admonition, { children: selectedInterest ? (_jsxs(Trans, { children: ["No results for \"", interestsDisplayNames[selectedInterest], "\"."] })) : (_jsx(Trans, { children: "No results." })) }) }));
            }
            case 'feed': {
                return (_jsx(View, { style: [
                        a.border_t,
                        t.atoms.border_contrast_low,
                        a.px_lg,
                        a.py_lg,
                    ], children: _jsx(FeedCard.Default, { view: item.feed, onPress: function () {
                            if (!useFullExperience) {
                                return;
                            }
                            ax.metric('feed:suggestion:press', {
                                feedUrl: item.feed.uri,
                            });
                        } }) }));
            }
            case 'starterPack': {
                return (_jsx(View, { style: [a.px_lg, a.pb_lg], children: _jsx(StarterPackCard, { view: item.view }) }));
            }
            case 'starterPackSkeleton': {
                return (_jsx(View, { style: [a.px_lg, a.pb_lg], children: _jsx(StarterPackCardSkeleton, {}) }));
            }
            case 'loadMore': {
                return (_jsx(View, { style: [a.border_t, t.atoms.border_contrast_low], children: _jsx(LoadMore, { item: item }) }));
            }
            case 'profilePlaceholder': {
                return (_jsx(_Fragment, { children: Array.from({ length: 3 }).map(function (__, i) { return (_jsx(View, { style: [
                            a.px_lg,
                            a.py_lg,
                            a.border_t,
                            t.atoms.border_contrast_low,
                        ], children: _jsxs(ProfileCard.Outer, { children: [_jsxs(ProfileCard.Header, { children: [_jsx(ProfileCard.AvatarPlaceholder, {}), _jsx(ProfileCard.NameAndHandlePlaceholder, {})] }), _jsx(ProfileCard.DescriptionPlaceholder, { numberOfLines: 2 })] }) }, i)); }) }));
            }
            case 'feedPlaceholder': {
                return _jsx(FeedFeedLoadingPlaceholder, {});
            }
            case 'error':
            case 'preview:error': {
                return (_jsx(View, { style: [
                        a.border_t,
                        a.pt_md,
                        a.px_md,
                        t.atoms.border_contrast_low,
                    ], children: _jsxs(View, { style: [
                            a.flex_row,
                            a.gap_md,
                            a.p_lg,
                            a.rounded_sm,
                            t.atoms.bg_contrast_25,
                        ], children: [_jsx(CircleInfo, { size: "md", fill: t.palette.negative_400 }), _jsxs(View, { style: [a.flex_1, a.gap_sm], children: [_jsx(Text, { style: [a.font_semi_bold, a.leading_snug], children: item.message }), _jsx(Text, { style: [
                                            a.italic,
                                            a.leading_snug,
                                            t.atoms.text_contrast_medium,
                                        ], children: item.error })] })] }) }));
            }
            // feed previews
            case 'preview:spacer': {
                return _jsx(View, { style: [a.w_full, a.pt_4xl] });
            }
            case 'preview:empty': {
                return null; // what should we do here?
            }
            case 'preview:loading': {
                return (_jsx(View, { style: [a.py_2xl, a.flex_1, a.align_center], children: _jsx(Loader, { size: "lg" }) }));
            }
            case 'preview:header': {
                return (_jsxs(ModuleHeader.Container, { style: [a.pt_xs], bottomBorder: true, children: [_jsx(View, { style: [a.absolute, a.inset_0, t.atoms.bg, { top: -2 }] }), _jsxs(ModuleHeader.FeedLink, { feed: item.feed, children: [_jsx(ModuleHeader.FeedAvatar, { feed: item.feed }), _jsxs(View, { style: [a.flex_1, a.gap_2xs], children: [_jsx(ModuleHeader.TitleText, { style: [a.text_lg], children: item.feed.displayName }), _jsx(ModuleHeader.SubtitleText, { children: _jsxs(Trans, { children: ["By ", sanitizeHandle(item.feed.creator.handle, '@')] }) })] })] }), _jsx(ModuleHeader.PinButton, { feed: item.feed })] }));
            }
            case 'preview:footer': {
                return (_jsx(View, { style: [
                        a.border_t,
                        t.atoms.border_contrast_low,
                        a.w_full,
                        a.pt_4xl,
                    ] }));
            }
            case 'preview:sliceItem': {
                var slice = item.slice;
                var indexInSlice = item.indexInSlice;
                var subItem = slice.items[indexInSlice];
                return (_jsx(PostFeedItem, { post: subItem.post, record: subItem.record, reason: indexInSlice === 0 ? slice.reason : undefined, feedContext: slice.feedContext, reqId: slice.reqId, moderation: subItem.moderation, parentAuthor: subItem.parentAuthor, showReplyTo: item.showReplyTo, isThreadParent: isThreadParentAt(slice.items, indexInSlice), isThreadChild: isThreadChildAt(slice.items, indexInSlice), isThreadLastChild: isThreadChildAt(slice.items, indexInSlice) &&
                        slice.items.length === indexInSlice + 1, isParentBlocked: subItem.isParentBlocked, isParentNotFound: subItem.isParentNotFound, hideTopBorder: item.hideTopBorder, rootPost: slice.items[0].post }));
            }
            case 'preview:sliceViewFullThread': {
                return _jsx(ViewFullThread, { uri: item.uri });
            }
            case 'preview:loadMoreError': {
                return (_jsx(LoadMoreRetryBtn, { label: _(msg(templateObject_21 || (templateObject_21 = __makeTemplateObject(["There was an issue fetching posts. Tap here to try again."], ["There was an issue fetching posts. Tap here to try again."])))), onPress: handleOnPressRetry }));
            }
            case 'interests-card': {
                return _jsx(ExploreInterestsCard, {});
            }
            case 'liveEventFeedsBanner': {
                return _jsx(ExploreScreenLiveEventFeedsBanner, {});
            }
        }
    }, [
        ax,
        t.atoms.border_contrast_low,
        t.atoms.bg_contrast_25,
        t.atoms.text_contrast_medium,
        t.atoms.bg,
        t.palette.negative_400,
        focusSearchInput,
        selectedInterest,
        moderationOpts,
        interestsDisplayNames,
        useFullExperience,
        _,
        fetchNextPageFeedPreviews,
    ]);
    var stickyHeaderIndices = useMemo(function () {
        return items.reduce(function (acc, curr) {
            return ['topBorder', 'preview:header'].includes(curr.type)
                ? acc.concat(items.indexOf(curr))
                : acc;
        }, []);
    }, [items]);
    // track headers and report module viewability
    var alreadyReportedRef = useRef(new Map());
    var seenProfilesRef = useRef(new Set());
    var onItemSeen = useCallback(function (item) {
        var module;
        if (item.type === 'trendingTopics' || item.type === 'trendingVideos') {
            module = item.type;
        }
        else if (item.type === 'profile') {
            module = 'suggestedAccounts';
            // Track individual profile seen events
            if (!seenProfilesRef.current.has(item.profile.did)) {
                seenProfilesRef.current.add(item.profile.did);
                var position = suggestedFollowsModule.findIndex(function (i) { return i.type === 'profile' && i.profile.did === item.profile.did; });
                ax.metric('suggestedUser:seen', {
                    logContext: 'Explore',
                    recId: item.recId,
                    position: position !== -1 ? position - 1 : 0, // -1 to account for header
                    suggestedDid: item.profile.did,
                    category: null,
                });
            }
        }
        else if (item.type === 'feed') {
            module = 'suggestedFeeds';
        }
        else if (item.type === 'starterPack') {
            module = 'suggestedStarterPacks';
        }
        else if (item.type === 'preview:sliceItem') {
            module = "feed:feedgen|".concat(item.feed.uri);
        }
        else {
            return;
        }
        if (!alreadyReportedRef.current.has(module)) {
            alreadyReportedRef.current.set(module, module);
            ax.metric('explore:module:seen', { module: module });
        }
    }, [ax, suggestedFollowsModule]);
    var handleOnEndReached = function () {
        void onLoadMoreFeedPreviews();
    };
    var handleOnRefresh = function () {
        void onPTR();
    };
    return (_jsx(List, { data: items, renderItem: renderItem, keyExtractor: keyExtractor, desktopFixedHeight: true, contentContainerStyle: { paddingBottom: 100 }, keyboardShouldPersistTaps: "handled", keyboardDismissMode: "on-drag", stickyHeaderIndices: native(stickyHeaderIndices), viewabilityConfig: viewabilityConfig, onItemSeen: onItemSeen, onEndReached: handleOnEndReached, 
        /**
         * Default: 2
         */
        onEndReachedThreshold: 4, 
        /**
         * Default: 10
         */
        initialNumToRender: 10, 
        /**
         * Default: 21
         */
        windowSize: platform({ android: 11 }), 
        /**
         * Default: 10
         *
         * NOTE: This was 1 on Android. Unfortunately this leads to the list totally freaking out
         * when the sticky headers changed. I made a minimal reproduction and yeah, it's this prop.
         * Totally fine when the sticky headers are static, but when they're dynamic, it's a mess.
         *
         * Repro: https://github.com/mozzius/stickyindices-repro
         *
         * I then found doubling this prop on iOS also reduced it freaking out there as well.
         *
         * Trades off seeing more blank space due to it having to render more items before it can show anything.
         * -sfn
         */
        maxToRenderPerBatch: platform({ android: 10, ios: 20 }), 
        /**
         * Default: 50
         *
         * NOTE: This was 25 on Android. However, due to maxToRenderPerBatch being set to 10,
         * the lower batching period is no longer necessary (?)
         */
        updateCellsBatchingPeriod: 50, refreshing: isPTR, onRefresh: handleOnRefresh }));
}
function keyExtractor(item) {
    return item.key;
}
var viewabilityConfig = {
    itemVisiblePercentThreshold: 100,
};
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15, templateObject_16, templateObject_17, templateObject_18, templateObject_19, templateObject_20, templateObject_21;
