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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo, useCallback, useEffect, useMemo, useRef, useState, } from 'react';
import { ActivityIndicator, AppState, Dimensions, LayoutAnimation, StyleSheet, View, } from 'react-native';
import { AppBskyEmbedVideo, } from '@atproto/api';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useQueryClient } from '@tanstack/react-query';
import { isStatusStillActive, validateStatus } from '#/lib/actor-status';
import { DISCOVER_FEED_URI, KNOWN_SHUTDOWN_FEEDS } from '#/lib/constants';
import { useInitialNumToRender } from '#/lib/hooks/useInitialNumToRender';
import { useNonReactiveCallback } from '#/lib/hooks/useNonReactiveCallback';
import { isNetworkError } from '#/lib/strings/errors';
import { logger } from '#/logger';
import { usePostAuthorShadowFilter } from '#/state/cache/profile-shadow';
import { listenPostCreated } from '#/state/events';
import { useFeedFeedbackContext } from '#/state/feed-feedback';
import { useTrendingSettings } from '#/state/preferences/trending';
import { STALE } from '#/state/queries';
import { pollLatest, RQKEY, usePostFeedQuery, } from '#/state/queries/post-feed';
import { useLiveNowConfig } from '#/state/service-config';
import { useSession } from '#/state/session';
import { useProgressGuide } from '#/state/shell/progress-guide';
import { useSelectedFeed } from '#/state/shell/selected-feed';
import { List } from '#/view/com/util/List';
import { PostFeedLoadingPlaceholder } from '#/view/com/util/LoadingPlaceholder';
import { LoadMoreRetryBtn } from '#/view/com/util/LoadMoreRetryBtn';
import { useBreakpoints, useLayoutBreakpoints } from '#/alf';
import { AgeAssuranceDismissibleFeedBanner, useInternalState as useAgeAssuranceBannerState, } from '#/components/ageAssurance/AgeAssuranceDismissibleFeedBanner';
import { ProgressGuide, SuggestedFollows } from '#/components/FeedInterstitials';
import { PostFeedVideoGridRow, PostFeedVideoGridRowPlaceholder, } from '#/components/feeds/PostFeedVideoGridRow';
import { TrendingInterstitial } from '#/components/interstitials/Trending';
import { TrendingVideos as TrendingVideosInterstitial } from '#/components/interstitials/TrendingVideos';
import { useAnalytics } from '#/analytics';
import { IS_IOS, IS_NATIVE, IS_WEB } from '#/env';
import { DiscoverFeedLiveEventFeedsAndTrendingBanner } from '#/features/liveEvents/components/DiscoverFeedLiveEventFeedsAndTrendingBanner';
import { ComposerPrompt } from '../feeds/ComposerPrompt';
import { DiscoverFallbackHeader } from './DiscoverFallbackHeader';
import { FeedShutdownMsg } from './FeedShutdownMsg';
import { PostFeedErrorMessage } from './PostFeedErrorMessage';
import { PostFeedItem } from './PostFeedItem';
import { ShowLessFollowup } from './ShowLessFollowup';
import { ViewFullThread } from './ViewFullThread';
export function getItemsForFeedback(feedRow) {
    if (feedRow.type === 'sliceItem') {
        return feedRow.slice.items.map(function (item) { return ({
            item: item,
            feedContext: feedRow.slice.feedContext,
            reqId: feedRow.slice.reqId,
        }); });
    }
    else if (feedRow.type === 'videoGridRow') {
        return feedRow.items.map(function (item, i) { return ({
            item: item,
            feedContext: feedRow.feedContexts[i],
            reqId: feedRow.reqIds[i],
        }); });
    }
    else {
        return [];
    }
}
// DISABLED need to check if this is causing random feed refreshes -prf
// const REFRESH_AFTER = STALE.HOURS.ONE
var CHECK_LATEST_AFTER = STALE.SECONDS.THIRTY;
var PostFeed = function (_a) {
    var feed = _a.feed, feedParams = _a.feedParams, ignoreFilterFor = _a.ignoreFilterFor, style = _a.style, enabled = _a.enabled, pollInterval = _a.pollInterval, disablePoll = _a.disablePoll, scrollElRef = _a.scrollElRef, onScrolledDownChange = _a.onScrolledDownChange, onHasNew = _a.onHasNew, renderEmptyState = _a.renderEmptyState, renderEndOfFeed = _a.renderEndOfFeed, testID = _a.testID, _b = _a.headerOffset, headerOffset = _b === void 0 ? 0 : _b, progressViewOffset = _a.progressViewOffset, desktopFixedHeightOffset = _a.desktopFixedHeightOffset, ListHeaderComponent = _a.ListHeaderComponent, extraData = _a.extraData, savedFeedConfig = _a.savedFeedConfig, initialNumToRenderOverride = _a.initialNumToRender, _c = _a.isVideoFeed, isVideoFeed = _c === void 0 ? false : _c;
    var ax = useAnalytics();
    var _ = useLingui()._;
    var queryClient = useQueryClient();
    var _d = useSession(), currentAccount = _d.currentAccount, hasSession = _d.hasSession;
    var initialNumToRender = useInitialNumToRender();
    var feedFeedback = useFeedFeedbackContext();
    var _e = useState(false), isPTRing = _e[0], setIsPTRing = _e[1];
    var lastFetchRef = useRef(Date.now());
    var _f = feed.split('|'), feedType = _f[0], feedUriOrActorDid = _f[1], feedTab = _f[2];
    var gtMobile = useBreakpoints().gtMobile;
    var rightNavVisible = useLayoutBreakpoints().rightNavVisible;
    var areVideoFeedsEnabled = IS_NATIVE;
    var _g = useState(function () { return new Set(); }), hasPressedShowLessUris = _g[0], setHasPressedShowLessUris = _g[1];
    var onPressShowLess = useCallback(function (interaction) {
        if (interaction.item) {
            var uri_1 = interaction.item;
            setHasPressedShowLessUris(function (prev) { return new Set(__spreadArray(__spreadArray([], prev, true), [uri_1], false)); });
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        }
    }, []);
    var feedCacheKey = feedParams === null || feedParams === void 0 ? void 0 : feedParams.feedCacheKey;
    var opts = useMemo(function () { return ({ enabled: enabled, ignoreFilterFor: ignoreFilterFor }); }, [enabled, ignoreFilterFor]);
    var _h = usePostFeedQuery(feed, feedParams, opts), data = _h.data, isFetching = _h.isFetching, isFetched = _h.isFetched, isError = _h.isError, error = _h.error, refetch = _h.refetch, hasNextPage = _h.hasNextPage, isFetchingNextPage = _h.isFetchingNextPage, fetchNextPage = _h.fetchNextPage;
    var lastFetchedAt = data === null || data === void 0 ? void 0 : data.pages[0].fetchedAt;
    if (lastFetchedAt) {
        lastFetchRef.current = lastFetchedAt;
    }
    var isEmpty = useMemo(function () { var _a; return !isFetching && !((_a = data === null || data === void 0 ? void 0 : data.pages) === null || _a === void 0 ? void 0 : _a.some(function (page) { return page.slices.length; })); }, [isFetching, data]);
    var checkForNew = useNonReactiveCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
        var e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(data === null || data === void 0 ? void 0 : data.pages[0]) || isFetching || !onHasNew || !enabled || disablePoll) {
                        return [2 /*return*/];
                    }
                    // Discover always has fresh content
                    if (feedUriOrActorDid === DISCOVER_FEED_URI) {
                        return [2 /*return*/, onHasNew(true)];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, pollLatest(data.pages[0])];
                case 2:
                    if (_a.sent()) {
                        if (isEmpty) {
                            refetch();
                        }
                        else {
                            onHasNew(true);
                        }
                    }
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _a.sent();
                    if (!isNetworkError(e_1)) {
                        logger.error('Poll latest failed', { feed: feed, message: String(e_1) });
                    }
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); });
    var myDid = (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did) || '';
    var onPostCreated = useCallback(function () {
        // NOTE
        // only invalidate if there's 1 page
        // more than 1 page can trigger some UI freakouts on iOS and android
        // -prf
        if ((data === null || data === void 0 ? void 0 : data.pages.length) === 1 &&
            (feed === 'following' ||
                feed === "author|".concat(myDid, "|posts_and_author_threads"))) {
            queryClient.invalidateQueries({ queryKey: RQKEY(feed) });
        }
    }, [queryClient, feed, data, myDid]);
    useEffect(function () {
        return listenPostCreated(onPostCreated);
    }, [onPostCreated]);
    useEffect(function () {
        if (enabled && !disablePoll) {
            var timeSinceFirstLoad = Date.now() - lastFetchRef.current;
            if (isEmpty || timeSinceFirstLoad > CHECK_LATEST_AFTER) {
                // check for new on enable (aka on focus)
                checkForNew();
            }
        }
    }, [enabled, isEmpty, disablePoll, checkForNew]);
    useEffect(function () {
        var cleanup1, cleanup2;
        var subscription = AppState.addEventListener('change', function (nextAppState) {
            // check for new on app foreground
            if (nextAppState === 'active') {
                checkForNew();
            }
        });
        cleanup1 = function () { return subscription.remove(); };
        if (pollInterval) {
            // check for new on interval
            var i_1 = setInterval(function () {
                checkForNew();
            }, pollInterval);
            cleanup2 = function () { return clearInterval(i_1); };
        }
        return function () {
            cleanup1 === null || cleanup1 === void 0 ? void 0 : cleanup1();
            cleanup2 === null || cleanup2 === void 0 ? void 0 : cleanup2();
        };
    }, [pollInterval, checkForNew]);
    var followProgressGuide = useProgressGuide('follow-10');
    var followAndLikeProgressGuide = useProgressGuide('like-10-and-follow-7');
    var showProgressIntersitial = (followProgressGuide || followAndLikeProgressGuide) && !rightNavVisible;
    var trendingVideoDisabled = useTrendingSettings().trendingVideoDisabled;
    var ageAssuranceBannerState = useAgeAssuranceBannerState();
    var selectedFeed = useSelectedFeed();
    /**
     * Cached value of whether the current feed was selected at startup. We don't
     * want this to update when user swipes.
     */
    var isCurrentFeedAtStartupSelected = useState(selectedFeed === feed)[0];
    var blockedOrMutedAuthors = usePostAuthorShadowFilter(
    // author feeds have their own handling
    feed.startsWith('author|') ? undefined : data === null || data === void 0 ? void 0 : data.pages);
    var feedItems = useMemo(function () {
        var _a;
        // wraps a slice item, and replaces it with a showLessFollowup item
        // if the user has pressed show less on it
        var sliceItem = function (row) {
            var _a;
            if (hasPressedShowLessUris.has((_a = row.slice.items[row.indexInSlice]) === null || _a === void 0 ? void 0 : _a.uri)) {
                return {
                    type: 'showLessFollowup',
                    key: row.key,
                };
            }
            else {
                return row;
            }
        };
        var feedKind;
        if (feedType === 'following') {
            feedKind = 'following';
        }
        else if (feedUriOrActorDid === DISCOVER_FEED_URI) {
            feedKind = 'discover';
        }
        else if (feedType === 'author' &&
            (feedTab === 'posts_and_author_threads' ||
                feedTab === 'posts_with_replies')) {
            feedKind = 'profile';
        }
        var arr = [];
        if (KNOWN_SHUTDOWN_FEEDS.includes(feedUriOrActorDid)) {
            arr.push({
                type: 'feedShutdownMsg',
                key: 'feedShutdownMsg',
            });
        }
        if (isFetched) {
            if (isError && isEmpty) {
                arr.push({
                    type: 'error',
                    key: 'error',
                });
            }
            else if (isEmpty) {
                arr.push({
                    type: 'empty',
                    key: 'empty',
                });
            }
            else if (data) {
                var sliceIndex = -1;
                if (isVideoFeed) {
                    var videos = [];
                    for (var _i = 0, _b = data.pages; _i < _b.length; _i++) {
                        var page = _b[_i];
                        var _loop_1 = function (slice) {
                            var item = slice.items.find(function (item) { return item.uri === slice.feedPostUri; });
                            if (item &&
                                AppBskyEmbedVideo.isView(item.post.embed) &&
                                !blockedOrMutedAuthors.includes(item.post.author.did)) {
                                videos.push({
                                    item: item,
                                    feedContext: slice.feedContext,
                                    reqId: slice.reqId,
                                });
                            }
                        };
                        for (var _c = 0, _d = page.slices; _c < _d.length; _c++) {
                            var slice = _d[_c];
                            _loop_1(slice);
                        }
                    }
                    var rows = [];
                    for (var i = 0; i < videos.length; i++) {
                        var video = videos[i];
                        var item = video.item;
                        var cols = gtMobile ? 3 : 2;
                        var rowItem = {
                            item: item,
                            feedContext: video.feedContext,
                            reqId: video.reqId,
                        };
                        if (i % cols === 0) {
                            rows.push([rowItem]);
                        }
                        else {
                            rows[rows.length - 1].push(rowItem);
                        }
                    }
                    for (var _e = 0, rows_1 = rows; _e < rows_1.length; _e++) {
                        var row = rows_1[_e];
                        sliceIndex++;
                        arr.push({
                            type: 'videoGridRow',
                            key: row.map(function (r) { return r.item._reactKey; }).join('-'),
                            items: row.map(function (r) { return r.item; }),
                            sourceFeedUri: feedUriOrActorDid,
                            feedContexts: row.map(function (r) { return r.feedContext; }),
                            reqIds: row.map(function (r) { return r.reqId; }),
                        });
                    }
                }
                else {
                    for (var _f = 0, _g = data === null || data === void 0 ? void 0 : data.pages; _f < _g.length; _f++) {
                        var page = _g[_f];
                        for (var _h = 0, _j = page.slices; _h < _j.length; _h++) {
                            var slice = _j[_h];
                            sliceIndex++;
                            if (hasSession) {
                                if (feedKind === 'discover') {
                                    if (sliceIndex === 0) {
                                        if (showProgressIntersitial) {
                                            arr.push({
                                                type: 'interstitialProgressGuide',
                                                key: 'interstitial-' + sliceIndex + '-' + lastFetchedAt,
                                            });
                                        }
                                        else {
                                            /*
                                             * Only insert if Discover was the last selected feed at
                                             * startup, the progress guide isn't shown, and the
                                             * banner is eligible to be shown.
                                             */
                                            if (isCurrentFeedAtStartupSelected &&
                                                ageAssuranceBannerState.visible) {
                                                arr.push({
                                                    type: 'ageAssuranceBanner',
                                                    key: 'ageAssuranceBanner-' + sliceIndex,
                                                });
                                            }
                                        }
                                        arr.push({
                                            type: 'liveEventFeedsAndTrendingBanner',
                                            key: 'liveEventFeedsAndTrendingBanner-' + sliceIndex,
                                        });
                                        // Show composer prompt for Discover and Following feeds
                                        if (hasSession &&
                                            (feedUriOrActorDid === DISCOVER_FEED_URI ||
                                                feed === 'following')) {
                                            arr.push({
                                                type: 'composerPrompt',
                                                key: 'composerPrompt-' + sliceIndex,
                                            });
                                        }
                                    }
                                    else if (sliceIndex === 15) {
                                        if (areVideoFeedsEnabled && !trendingVideoDisabled) {
                                            arr.push({
                                                type: 'interstitialTrendingVideos',
                                                key: 'interstitial-' + sliceIndex + '-' + lastFetchedAt,
                                            });
                                        }
                                    }
                                    else if (sliceIndex === 30) {
                                        arr.push({
                                            type: 'interstitialFollows',
                                            key: 'interstitial-' + sliceIndex + '-' + lastFetchedAt,
                                        });
                                    }
                                }
                                else if (feedKind === 'following') {
                                    if (sliceIndex === 0) {
                                        // Show composer prompt for Following feed
                                        if (hasSession) {
                                            arr.push({
                                                type: 'composerPrompt',
                                                key: 'composerPrompt-' + sliceIndex,
                                            });
                                        }
                                    }
                                }
                                else if (feedKind === 'profile') {
                                    if (sliceIndex === 5) {
                                        arr.push({
                                            type: 'interstitialFollows',
                                            key: 'interstitial-' + sliceIndex + '-' + lastFetchedAt,
                                        });
                                    }
                                }
                                else {
                                    /*
                                     * Only insert if this feed was the last selected feed at
                                     * startup and the banner is eligible to be shown.
                                     */
                                    if (sliceIndex === 0 &&
                                        isCurrentFeedAtStartupSelected &&
                                        ageAssuranceBannerState.visible) {
                                        arr.push({
                                            type: 'ageAssuranceBanner',
                                            key: 'ageAssuranceBanner-' + sliceIndex,
                                        });
                                    }
                                }
                            }
                            if (slice.isFallbackMarker) {
                                arr.push({
                                    type: 'fallbackMarker',
                                    key: 'sliceFallbackMarker-' + sliceIndex + '-' + lastFetchedAt,
                                });
                            }
                            else if (slice.items.some(function (item) {
                                return blockedOrMutedAuthors.includes(item.post.author.did);
                            })) {
                                // skip
                            }
                            else if (slice.isIncompleteThread && slice.items.length >= 3) {
                                var beforeLast = slice.items.length - 2;
                                var last = slice.items.length - 1;
                                arr.push(sliceItem({
                                    type: 'sliceItem',
                                    key: slice.items[0]._reactKey,
                                    slice: slice,
                                    indexInSlice: 0,
                                    showReplyTo: false,
                                }));
                                arr.push({
                                    type: 'sliceViewFullThread',
                                    key: slice._reactKey + '-viewFullThread',
                                    uri: slice.items[0].uri,
                                });
                                arr.push(sliceItem({
                                    type: 'sliceItem',
                                    key: slice.items[beforeLast]._reactKey,
                                    slice: slice,
                                    indexInSlice: beforeLast,
                                    showReplyTo: ((_a = slice.items[beforeLast].parentAuthor) === null || _a === void 0 ? void 0 : _a.did) !==
                                        slice.items[beforeLast].post.author.did,
                                }));
                                arr.push(sliceItem({
                                    type: 'sliceItem',
                                    key: slice.items[last]._reactKey,
                                    slice: slice,
                                    indexInSlice: last,
                                    showReplyTo: false,
                                }));
                            }
                            else {
                                for (var i = 0; i < slice.items.length; i++) {
                                    arr.push(sliceItem({
                                        type: 'sliceItem',
                                        key: slice.items[i]._reactKey,
                                        slice: slice,
                                        indexInSlice: i,
                                        showReplyTo: i === 0,
                                    }));
                                }
                            }
                        }
                    }
                }
            }
            if (isError && !isEmpty) {
                arr.push({
                    type: 'loadMoreError',
                    key: 'loadMoreError',
                });
            }
        }
        else {
            if (isVideoFeed) {
                arr.push({
                    type: 'videoGridRowPlaceholder',
                    key: 'videoGridRowPlaceholder',
                });
            }
            else {
                arr.push({
                    type: 'loading',
                    key: 'loading',
                });
            }
        }
        return arr;
    }, [
        isFetched,
        isError,
        isEmpty,
        lastFetchedAt,
        data,
        feed,
        feedType,
        feedUriOrActorDid,
        feedTab,
        hasSession,
        showProgressIntersitial,
        trendingVideoDisabled,
        gtMobile,
        isVideoFeed,
        areVideoFeedsEnabled,
        hasPressedShowLessUris,
        ageAssuranceBannerState,
        isCurrentFeedAtStartupSelected,
        blockedOrMutedAuthors,
    ]);
    // events
    // =
    var onRefresh = useCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
        var err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    ax.metric('feed:refresh', {
                        feedType: feedType,
                        feedUrl: feed,
                        reason: 'pull-to-refresh',
                    });
                    setIsPTRing(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, refetch()];
                case 2:
                    _a.sent();
                    onHasNew === null || onHasNew === void 0 ? void 0 : onHasNew(false);
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    logger.error('Failed to refresh posts feed', { message: err_1 });
                    return [3 /*break*/, 4];
                case 4:
                    setIsPTRing(false);
                    return [2 /*return*/];
            }
        });
    }); }, [ax, refetch, setIsPTRing, onHasNew, feed, feedType]);
    var onEndReached = useCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
        var err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (isFetching || !hasNextPage || isError)
                        return [2 /*return*/];
                    ax.metric('feed:endReached', {
                        feedType: feedType,
                        feedUrl: feed,
                        itemCount: feedItems.length,
                    });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fetchNextPage()];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    err_2 = _a.sent();
                    logger.error('Failed to load more posts', { message: err_2 });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [
        ax,
        isFetching,
        hasNextPage,
        isError,
        fetchNextPage,
        feed,
        feedType,
        feedItems.length,
    ]);
    var onPressTryAgain = useCallback(function () {
        refetch();
        onHasNew === null || onHasNew === void 0 ? void 0 : onHasNew(false);
    }, [refetch, onHasNew]);
    var onPressRetryLoadMore = useCallback(function () {
        fetchNextPage();
    }, [fetchNextPage]);
    // rendering
    // =
    var renderItem = useCallback(function (_a) {
        var row = _a.item, rowIndex = _a.index;
        if (row.type === 'empty') {
            return renderEmptyState();
        }
        else if (row.type === 'error') {
            return (_jsx(PostFeedErrorMessage, { feedDesc: feed, error: error !== null && error !== void 0 ? error : undefined, onPressTryAgain: onPressTryAgain, savedFeedConfig: savedFeedConfig }));
        }
        else if (row.type === 'loadMoreError') {
            return (_jsx(LoadMoreRetryBtn, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["There was an issue fetching posts. Tap here to try again."], ["There was an issue fetching posts. Tap here to try again."])))), onPress: onPressRetryLoadMore }));
        }
        else if (row.type === 'loading') {
            return _jsx(PostFeedLoadingPlaceholder, {});
        }
        else if (row.type === 'feedShutdownMsg') {
            return _jsx(FeedShutdownMsg, { feedUri: feedUriOrActorDid });
        }
        else if (row.type === 'interstitialFollows') {
            return _jsx(SuggestedFollows, { feed: feed });
        }
        else if (row.type === 'interstitialProgressGuide') {
            return _jsx(ProgressGuide, {});
        }
        else if (row.type === 'ageAssuranceBanner') {
            return _jsx(AgeAssuranceDismissibleFeedBanner, {});
        }
        else if (row.type === 'interstitialTrending') {
            return _jsx(TrendingInterstitial, {});
        }
        else if (row.type === 'liveEventFeedsAndTrendingBanner') {
            return _jsx(DiscoverFeedLiveEventFeedsAndTrendingBanner, {});
        }
        else if (row.type === 'composerPrompt') {
            return _jsx(ComposerPrompt, {});
        }
        else if (row.type === 'interstitialTrendingVideos') {
            return _jsx(TrendingVideosInterstitial, {});
        }
        else if (row.type === 'fallbackMarker') {
            // HACK
            // tell the user we fell back to discover
            // see home.ts (feed api) for more info
            // -prf
            return _jsx(DiscoverFallbackHeader, {});
        }
        else if (row.type === 'sliceItem') {
            var slice = row.slice;
            var indexInSlice = row.indexInSlice;
            var item = slice.items[indexInSlice];
            return (_jsx(PostFeedItem, { post: item.post, record: item.record, reason: indexInSlice === 0 ? slice.reason : undefined, feedContext: slice.feedContext, reqId: slice.reqId, moderation: item.moderation, parentAuthor: item.parentAuthor, showReplyTo: row.showReplyTo, isThreadParent: isThreadParentAt(slice.items, indexInSlice), isThreadChild: isThreadChildAt(slice.items, indexInSlice), isThreadLastChild: isThreadChildAt(slice.items, indexInSlice) &&
                    slice.items.length === indexInSlice + 1, isParentBlocked: item.isParentBlocked, isParentNotFound: item.isParentNotFound, hideTopBorder: rowIndex === 0 && indexInSlice === 0, rootPost: slice.items[0].post, onShowLess: onPressShowLess }));
        }
        else if (row.type === 'sliceViewFullThread') {
            return _jsx(ViewFullThread, { uri: row.uri });
        }
        else if (row.type === 'videoGridRowPlaceholder') {
            return (_jsxs(View, { children: [_jsx(PostFeedVideoGridRowPlaceholder, {}), _jsx(PostFeedVideoGridRowPlaceholder, {}), _jsx(PostFeedVideoGridRowPlaceholder, {})] }));
        }
        else if (row.type === 'videoGridRow') {
            var sourceContext = void 0;
            if (feedType === 'author') {
                sourceContext = {
                    type: 'author',
                    did: feedUriOrActorDid,
                    filter: feedTab,
                };
            }
            else {
                sourceContext = {
                    type: 'feedgen',
                    uri: row.sourceFeedUri,
                    sourceInterstitial: feedCacheKey !== null && feedCacheKey !== void 0 ? feedCacheKey : 'none',
                };
            }
            return (_jsx(PostFeedVideoGridRow, { items: row.items, sourceContext: sourceContext }));
        }
        else if (row.type === 'showLessFollowup') {
            return _jsx(ShowLessFollowup, {});
        }
        else {
            return null;
        }
    }, [
        renderEmptyState,
        feed,
        error,
        onPressTryAgain,
        savedFeedConfig,
        _,
        onPressRetryLoadMore,
        feedType,
        feedUriOrActorDid,
        feedTab,
        feedCacheKey,
        onPressShowLess,
    ]);
    var shouldRenderEndOfFeed = !hasNextPage && !isEmpty && !isFetching && !isError && !!renderEndOfFeed;
    var FeedFooter = useCallback(function () {
        /**
         * A bit of padding at the bottom of the feed as you scroll and when you
         * reach the end, so that content isn't cut off by the bottom of the
         * screen.
         */
        var offset = Math.max(headerOffset, 32) * (IS_WEB ? 1 : 2);
        return isFetchingNextPage ? (_jsxs(View, { style: [styles.feedFooter], children: [_jsx(ActivityIndicator, {}), _jsx(View, { style: { height: offset } })] })) : shouldRenderEndOfFeed ? (_jsx(View, { style: { minHeight: offset }, children: renderEndOfFeed() })) : (_jsx(View, { style: { height: offset } }));
    }, [isFetchingNextPage, shouldRenderEndOfFeed, renderEndOfFeed, headerOffset]);
    var liveNowConfig = useLiveNowConfig();
    var seenActorWithStatusRef = useRef(new Set());
    var seenPostUrisRef = useRef(new Set());
    // Helper to calculate position in feed (count only root posts, not interstitials or thread replies)
    var getPostPosition = useNonReactiveCallback(function (type, key) {
        // Calculate position: find the row index in feedItems, then calculate position
        var rowIndex = feedItems.findIndex(function (row) { return row.type === 'sliceItem' && row.key === key; });
        if (rowIndex >= 0) {
            var position = 0;
            for (var i = 0; i < rowIndex && i < feedItems.length; i++) {
                var row = feedItems[i];
                if (row.type === 'sliceItem') {
                    // Only count root posts (indexInSlice === 0), not thread replies
                    if (row.indexInSlice === 0) {
                        position++;
                    }
                }
                else if (row.type === 'videoGridRow') {
                    // Count each video in the grid row
                    position += row.items.length;
                }
            }
            return position;
        }
    });
    var onItemSeen = useCallback(function (item) {
        feedFeedback.onItemSeen(item);
        // Track post:view events
        if (item.type === 'sliceItem') {
            var slice = item.slice;
            var indexInSlice = item.indexInSlice;
            var postItem = slice.items[indexInSlice];
            var post = postItem.post;
            // Only track the root post of each slice (index 0) to avoid double-counting thread items
            if (indexInSlice === 0 && !seenPostUrisRef.current.has(post.uri)) {
                seenPostUrisRef.current.add(post.uri);
                var position = getPostPosition('sliceItem', item.key);
                ax.metric('post:view', {
                    uri: post.uri,
                    authorDid: post.author.did,
                    logContext: 'FeedItem',
                    feedDescriptor: feedFeedback.feedDescriptor || feed,
                    position: position,
                });
            }
            // Live status tracking (existing code)
            var actor = post.author;
            if (actor.status &&
                validateStatus(actor.status, liveNowConfig) &&
                isStatusStillActive(actor.status.expiresAt)) {
                if (!seenActorWithStatusRef.current.has(actor.did)) {
                    seenActorWithStatusRef.current.add(actor.did);
                    ax.metric('live:view:post', {
                        subject: actor.did,
                        feed: feed,
                    });
                }
            }
        }
        else if (item.type === 'videoGridRow') {
            // Track each video in the grid row
            for (var i = 0; i < item.items.length; i++) {
                var postItem = item.items[i];
                var post = postItem.post;
                if (!seenPostUrisRef.current.has(post.uri)) {
                    seenPostUrisRef.current.add(post.uri);
                    var position = getPostPosition('videoGridRow', item.key);
                    ax.metric('post:view', {
                        uri: post.uri,
                        authorDid: post.author.did,
                        logContext: 'FeedItem',
                        feedDescriptor: feedFeedback.feedDescriptor || feed,
                        position: position,
                    });
                }
            }
        }
    }, [feedFeedback, feed, liveNowConfig, getPostPosition]);
    return (_jsx(View, { testID: testID, style: style, children: _jsx(List, { testID: testID ? "".concat(testID, "-flatlist") : undefined, ref: scrollElRef, data: feedItems, keyExtractor: function (item) { return item.key; }, renderItem: renderItem, ListFooterComponent: FeedFooter, ListHeaderComponent: ListHeaderComponent, refreshing: isPTRing, onRefresh: onRefresh, headerOffset: headerOffset, progressViewOffset: progressViewOffset, contentContainerStyle: {
                minHeight: Dimensions.get('window').height * 1.5,
            }, onScrolledDownChange: onScrolledDownChange, onEndReached: onEndReached, onEndReachedThreshold: 2, removeClippedSubviews: true, extraData: extraData, desktopFixedHeight: desktopFixedHeightOffset ? desktopFixedHeightOffset : true, initialNumToRender: initialNumToRenderOverride !== null && initialNumToRenderOverride !== void 0 ? initialNumToRenderOverride : initialNumToRender, windowSize: 9, maxToRenderPerBatch: IS_IOS ? 5 : 1, updateCellsBatchingPeriod: 40, onItemSeen: onItemSeen }) }));
};
PostFeed = memo(PostFeed);
export { PostFeed };
var styles = StyleSheet.create({
    feedFooter: { paddingTop: 20 },
});
export function isThreadParentAt(arr, i) {
    if (arr.length === 1) {
        return false;
    }
    return i < arr.length - 1;
}
export function isThreadChildAt(arr, i) {
    if (arr.length === 1) {
        return false;
    }
    return i > 0;
}
var templateObject_1;
