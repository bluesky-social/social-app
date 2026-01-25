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
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useFocusEffect } from '@react-navigation/native';
import debounce from 'lodash.debounce';
import { useOpenComposer } from '#/lib/hooks/useOpenComposer';
import { usePalette } from '#/lib/hooks/usePalette';
import { useWebMediaQueries } from '#/lib/hooks/useWebMediaQueries';
import { ComposeIcon2 } from '#/lib/icons';
import { cleanError } from '#/lib/strings/errors';
import { s } from '#/lib/styles';
import { useGetPopularFeedsQuery, useSavedFeeds, useSearchPopularFeedsMutation, } from '#/state/queries/feed';
import { useSession } from '#/state/session';
import { useSetMinimalShellMode } from '#/state/shell';
import { ErrorMessage } from '#/view/com/util/error/ErrorMessage';
import { FAB } from '#/view/com/util/fab/FAB';
import { List } from '#/view/com/util/List';
import { FeedFeedLoadingPlaceholder } from '#/view/com/util/LoadingPlaceholder';
import { Text } from '#/view/com/util/text/Text';
import { NoFollowingFeed } from '#/screens/Feeds/NoFollowingFeed';
import { NoSavedFeedsOfAnyType } from '#/screens/Feeds/NoSavedFeedsOfAnyType';
import { atoms as a, useTheme } from '#/alf';
import { ButtonIcon } from '#/components/Button';
import { Divider } from '#/components/Divider';
import * as FeedCard from '#/components/FeedCard';
import { SearchInput } from '#/components/forms/SearchInput';
import { IconCircle } from '#/components/IconCircle';
import { ChevronRight_Stroke2_Corner0_Rounded as ChevronRight } from '#/components/icons/Chevron';
import { FilterTimeline_Stroke2_Corner0_Rounded as FilterTimeline } from '#/components/icons/FilterTimeline';
import { ListMagnifyingGlass_Stroke2_Corner0_Rounded } from '#/components/icons/ListMagnifyingGlass';
import { ListSparkle_Stroke2_Corner0_Rounded } from '#/components/icons/ListSparkle';
import { SettingsGear2_Stroke2_Corner0_Rounded as Gear } from '#/components/icons/SettingsGear2';
import * as Layout from '#/components/Layout';
import { Link } from '#/components/Link';
import * as ListCard from '#/components/ListCard';
import { IS_NATIVE, IS_WEB } from '#/env';
export function FeedsScreen(_props) {
    var _this = this;
    var pal = usePalette('default');
    var openComposer = useOpenComposer().openComposer;
    var isMobile = useWebMediaQueries().isMobile;
    var _a = React.useState(''), query = _a[0], setQuery = _a[1];
    var _b = React.useState(false), isPTR = _b[0], setIsPTR = _b[1];
    var _c = useSavedFeeds(), savedFeeds = _c.data, isSavedFeedsPlaceholder = _c.isPlaceholderData, savedFeedsError = _c.error, refetchSavedFeeds = _c.refetch;
    var _d = useGetPopularFeedsQuery(), popularFeeds = _d.data, isPopularFeedsFetching = _d.isFetching, popularFeedsError = _d.error, refetchPopularFeeds = _d.refetch, fetchNextPopularFeedsPage = _d.fetchNextPage, isPopularFeedsFetchingNextPage = _d.isFetchingNextPage, hasNextPopularFeedsPage = _d.hasNextPage;
    var _ = useLingui()._;
    var setMinimalShellMode = useSetMinimalShellMode();
    var _f = useSearchPopularFeedsMutation(), searchResults = _f.data, search = _f.mutate, resetSearch = _f.reset, isSearchPending = _f.isPending, searchError = _f.error;
    var hasSession = useSession().hasSession;
    var listRef = React.useRef(null);
    /**
     * A search query is present. We may not have search results yet.
     */
    var isUserSearching = query.length > 1;
    var debouncedSearch = React.useMemo(function () { return debounce(function (q) { return search(q); }, 500); }, // debounce for 500ms
    [search]);
    var onPressCompose = React.useCallback(function () {
        openComposer({});
    }, [openComposer]);
    var onChangeQuery = React.useCallback(function (text) {
        setQuery(text);
        if (text.length > 1) {
            debouncedSearch(text);
        }
        else {
            refetchPopularFeeds();
            resetSearch();
        }
    }, [setQuery, refetchPopularFeeds, debouncedSearch, resetSearch]);
    var onPressCancelSearch = React.useCallback(function () {
        setQuery('');
        refetchPopularFeeds();
        resetSearch();
    }, [refetchPopularFeeds, setQuery, resetSearch]);
    var onSubmitQuery = React.useCallback(function () {
        debouncedSearch(query);
    }, [query, debouncedSearch]);
    var onPullToRefresh = React.useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsPTR(true);
                    return [4 /*yield*/, Promise.all([
                            refetchSavedFeeds().catch(function (_e) { return undefined; }),
                            refetchPopularFeeds().catch(function (_e) { return undefined; }),
                        ])];
                case 1:
                    _a.sent();
                    setIsPTR(false);
                    return [2 /*return*/];
            }
        });
    }); }, [setIsPTR, refetchSavedFeeds, refetchPopularFeeds]);
    var onEndReached = React.useCallback(function () {
        if (isPopularFeedsFetching ||
            isUserSearching ||
            !hasNextPopularFeedsPage ||
            popularFeedsError)
            return;
        fetchNextPopularFeedsPage();
    }, [
        isPopularFeedsFetching,
        isUserSearching,
        popularFeedsError,
        hasNextPopularFeedsPage,
        fetchNextPopularFeedsPage,
    ]);
    useFocusEffect(React.useCallback(function () {
        setMinimalShellMode(false);
    }, [setMinimalShellMode]));
    var items = React.useMemo(function () {
        var _a, _b, _c;
        var slices = [];
        var hasActualSavedCount = !isSavedFeedsPlaceholder ||
            (isSavedFeedsPlaceholder && ((savedFeeds === null || savedFeeds === void 0 ? void 0 : savedFeeds.count) || 0) > 0);
        var canShowDiscoverSection = !hasSession || (hasSession && hasActualSavedCount);
        if (hasSession) {
            slices.push({
                key: 'savedFeedsHeader',
                type: 'savedFeedsHeader',
            });
            if (savedFeedsError) {
                slices.push({
                    key: 'savedFeedsError',
                    type: 'error',
                    error: cleanError(savedFeedsError.toString()),
                });
            }
            else {
                if (isSavedFeedsPlaceholder && !(savedFeeds === null || savedFeeds === void 0 ? void 0 : savedFeeds.feeds.length)) {
                    /*
                     * Initial render in placeholder state is 0 on a cold page load,
                     * because preferences haven't loaded yet.
                     *
                     * In practice, `savedFeeds` is always defined, but we check for TS
                     * and for safety.
                     *
                     * In both cases, we show 4 as the the loading state.
                     */
                    var min = 8;
                    var count = savedFeeds
                        ? savedFeeds.count === 0
                            ? min
                            : savedFeeds.count
                        : min;
                    Array(count)
                        .fill(0)
                        .forEach(function (_, i) {
                        slices.push({
                            key: 'savedFeedPlaceholder' + i,
                            type: 'savedFeedPlaceholder',
                        });
                    });
                }
                else {
                    if ((_a = savedFeeds === null || savedFeeds === void 0 ? void 0 : savedFeeds.feeds) === null || _a === void 0 ? void 0 : _a.length) {
                        var noFollowingFeed = savedFeeds.feeds.every(function (f) { return f.type !== 'timeline'; });
                        slices = slices.concat(savedFeeds.feeds
                            .filter(function (s) {
                            return s.config.pinned;
                        })
                            .map(function (s) {
                            var _a;
                            return ({
                                key: "savedFeed:".concat((_a = s.view) === null || _a === void 0 ? void 0 : _a.uri, ":").concat(s.config.id),
                                type: 'savedFeed',
                                savedFeed: s,
                            });
                        }));
                        slices = slices.concat(savedFeeds.feeds
                            .filter(function (s) {
                            return !s.config.pinned;
                        })
                            .map(function (s) {
                            var _a;
                            return ({
                                key: "savedFeed:".concat((_a = s.view) === null || _a === void 0 ? void 0 : _a.uri, ":").concat(s.config.id),
                                type: 'savedFeed',
                                savedFeed: s,
                            });
                        }));
                        if (noFollowingFeed) {
                            slices.push({
                                key: 'noFollowingFeed',
                                type: 'noFollowingFeed',
                            });
                        }
                    }
                    else {
                        slices.push({
                            key: 'savedFeedNoResults',
                            type: 'savedFeedNoResults',
                        });
                    }
                }
            }
        }
        if (!hasSession || (hasSession && canShowDiscoverSection)) {
            slices.push({
                key: 'popularFeedsHeader',
                type: 'popularFeedsHeader',
            });
            if (popularFeedsError || searchError) {
                slices.push({
                    key: 'popularFeedsError',
                    type: 'error',
                    error: cleanError((_c = (_b = popularFeedsError === null || popularFeedsError === void 0 ? void 0 : popularFeedsError.toString()) !== null && _b !== void 0 ? _b : searchError === null || searchError === void 0 ? void 0 : searchError.toString()) !== null && _c !== void 0 ? _c : ''),
                });
            }
            else {
                if (isUserSearching) {
                    if (isSearchPending || !searchResults) {
                        slices.push({
                            key: 'popularFeedsLoading',
                            type: 'popularFeedsLoading',
                        });
                    }
                    else {
                        if (!searchResults || (searchResults === null || searchResults === void 0 ? void 0 : searchResults.length) === 0) {
                            slices.push({
                                key: 'popularFeedsNoResults',
                                type: 'popularFeedsNoResults',
                            });
                        }
                        else {
                            slices = slices.concat(searchResults.map(function (feed) { return ({
                                key: "popularFeed:".concat(feed.uri),
                                type: 'popularFeed',
                                feedUri: feed.uri,
                                feed: feed,
                            }); }));
                        }
                    }
                }
                else {
                    if (isPopularFeedsFetching && !(popularFeeds === null || popularFeeds === void 0 ? void 0 : popularFeeds.pages)) {
                        slices.push({
                            key: 'popularFeedsLoading',
                            type: 'popularFeedsLoading',
                        });
                    }
                    else {
                        if (!(popularFeeds === null || popularFeeds === void 0 ? void 0 : popularFeeds.pages)) {
                            slices.push({
                                key: 'popularFeedsNoResults',
                                type: 'popularFeedsNoResults',
                            });
                        }
                        else {
                            for (var _i = 0, _d = popularFeeds.pages || []; _i < _d.length; _i++) {
                                var page = _d[_i];
                                slices = slices.concat(page.feeds.map(function (feed) { return ({
                                    key: "popularFeed:".concat(feed.uri),
                                    type: 'popularFeed',
                                    feedUri: feed.uri,
                                    feed: feed,
                                }); }));
                            }
                            if (isPopularFeedsFetchingNextPage) {
                                slices.push({
                                    key: 'popularFeedsLoadingMore',
                                    type: 'popularFeedsLoadingMore',
                                });
                            }
                        }
                    }
                }
            }
        }
        return slices;
    }, [
        hasSession,
        savedFeeds,
        isSavedFeedsPlaceholder,
        savedFeedsError,
        popularFeeds,
        isPopularFeedsFetching,
        popularFeedsError,
        isPopularFeedsFetchingNextPage,
        searchResults,
        isSearchPending,
        searchError,
        isUserSearching,
    ]);
    var searchBarIndex = items.findIndex(function (item) { return item.type === 'popularFeedsHeader'; });
    var onChangeSearchFocus = React.useCallback(function (focus) {
        var _a, _b;
        if (focus && searchBarIndex > -1) {
            if (IS_NATIVE) {
                // scrollToIndex scrolls the exact right amount, so use if available
                (_a = listRef.current) === null || _a === void 0 ? void 0 : _a.scrollToIndex({
                    index: searchBarIndex,
                    animated: true,
                });
            }
            else {
                // web implementation only supports scrollToOffset
                // thus, we calculate the offset based on the index
                // pixel values are estimates, I wasn't able to get it pixel perfect :(
                var headerHeight = isMobile ? 43 : 53;
                var feedItemHeight = isMobile ? 49 : 58;
                (_b = listRef.current) === null || _b === void 0 ? void 0 : _b.scrollToOffset({
                    offset: searchBarIndex * feedItemHeight - headerHeight,
                    animated: true,
                });
            }
        }
    }, [searchBarIndex, isMobile]);
    var renderItem = React.useCallback(function (_a) {
        var item = _a.item;
        if (item.type === 'error') {
            return _jsx(ErrorMessage, { message: item.error });
        }
        else if (item.type === 'popularFeedsLoadingMore') {
            return (_jsx(View, { style: s.p10, children: _jsx(ActivityIndicator, { size: "large" }) }));
        }
        else if (item.type === 'savedFeedsHeader') {
            return _jsx(FeedsSavedHeader, {});
        }
        else if (item.type === 'savedFeedNoResults') {
            return (_jsx(View, { style: [
                    pal.border,
                    {
                        borderBottomWidth: 1,
                    },
                ], children: _jsx(NoSavedFeedsOfAnyType, {}) }));
        }
        else if (item.type === 'savedFeedPlaceholder') {
            return _jsx(SavedFeedPlaceholder, {});
        }
        else if (item.type === 'savedFeed') {
            return _jsx(FeedOrFollowing, { savedFeed: item.savedFeed });
        }
        else if (item.type === 'popularFeedsHeader') {
            return (_jsxs(_Fragment, { children: [_jsx(FeedsAboutHeader, {}), _jsx(View, { style: { paddingHorizontal: 12, paddingBottom: 4 }, children: _jsx(SearchInput, { placeholder: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Search feeds"], ["Search feeds"])))), value: query, onChangeText: onChangeQuery, onClearText: onPressCancelSearch, onSubmitEditing: onSubmitQuery, onFocus: function () { return onChangeSearchFocus(true); }, onBlur: function () { return onChangeSearchFocus(false); } }) })] }));
        }
        else if (item.type === 'popularFeedsLoading') {
            return _jsx(FeedFeedLoadingPlaceholder, {});
        }
        else if (item.type === 'popularFeed') {
            return (_jsxs(View, { style: [a.px_lg, a.pt_lg, a.gap_lg], children: [_jsx(FeedCard.Default, { view: item.feed }), _jsx(Divider, {})] }));
        }
        else if (item.type === 'popularFeedsNoResults') {
            return (_jsx(View, { style: {
                    paddingHorizontal: 16,
                    paddingTop: 10,
                    paddingBottom: '150%',
                }, children: _jsx(Text, { type: "lg", style: pal.textLight, children: _jsxs(Trans, { children: ["No results found for \"", query, "\""] }) }) }));
        }
        else if (item.type === 'noFollowingFeed') {
            return (_jsx(View, { style: [
                    pal.border,
                    {
                        borderBottomWidth: 1,
                    },
                ], children: _jsx(NoFollowingFeed, {}) }));
        }
        return null;
    }, [
        _,
        pal.border,
        pal.textLight,
        query,
        onChangeQuery,
        onPressCancelSearch,
        onSubmitQuery,
        onChangeSearchFocus,
    ]);
    return (_jsxs(Layout.Screen, { testID: "FeedsScreen", children: [_jsxs(Layout.Center, { children: [_jsxs(Layout.Header.Outer, { children: [_jsx(Layout.Header.BackButton, {}), _jsx(Layout.Header.Content, { children: _jsx(Layout.Header.TitleText, { children: _jsx(Trans, { children: "Feeds" }) }) }), _jsx(Layout.Header.Slot, { children: _jsx(Link, { testID: "editFeedsBtn", to: "/settings/saved-feeds", label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Edit My Feeds"], ["Edit My Feeds"])))), size: "small", variant: "ghost", color: "secondary", shape: "round", style: [a.justify_center, { right: -3 }], children: _jsx(ButtonIcon, { icon: Gear, size: "lg" }) }) })] }), _jsx(List, { ref: listRef, data: items, keyExtractor: function (item) { return item.key; }, contentContainerStyle: styles.contentContainer, renderItem: renderItem, refreshing: isPTR, onRefresh: isUserSearching ? undefined : onPullToRefresh, initialNumToRender: 10, onEndReached: onEndReached, desktopFixedHeight: true, keyboardShouldPersistTaps: "handled", keyboardDismissMode: "on-drag", sideBorders: false })] }), hasSession && (_jsx(FAB, { testID: "composeFAB", onPress: onPressCompose, icon: _jsx(ComposeIcon2, { strokeWidth: 1.5, size: 29, style: s.white }), accessibilityRole: "button", accessibilityLabel: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["New post"], ["New post"])))), accessibilityHint: "" }))] }));
}
function FeedOrFollowing(_a) {
    var savedFeed = _a.savedFeed;
    return savedFeed.type === 'timeline' ? (_jsx(FollowingFeed, {})) : (_jsx(SavedFeed, { savedFeed: savedFeed }));
}
function FollowingFeed() {
    var t = useTheme();
    var _ = useLingui()._;
    return (_jsx(View, { style: [
            a.flex_1,
            a.px_lg,
            a.py_md,
            a.border_b,
            t.atoms.border_contrast_low,
        ], children: _jsxs(FeedCard.Header, { children: [_jsx(View, { style: [
                        a.align_center,
                        a.justify_center,
                        {
                            width: 28,
                            height: 28,
                            borderRadius: 3,
                            backgroundColor: t.palette.primary_500,
                        },
                    ], children: _jsx(FilterTimeline, { style: [
                            {
                                width: 18,
                                height: 18,
                            },
                        ], fill: t.palette.white }) }), _jsx(FeedCard.TitleAndByline, { title: _(msg({ message: 'Following', context: 'feed-name' })) })] }) }));
}
function SavedFeed(_a) {
    var savedFeed = _a.savedFeed;
    var t = useTheme();
    var commonStyle = [
        a.w_full,
        a.flex_1,
        a.px_lg,
        a.py_md,
        a.border_b,
        t.atoms.border_contrast_low,
    ];
    return savedFeed.type === 'feed' ? (_jsx(FeedCard.Link, __assign({ testID: "saved-feed-".concat(savedFeed.view.displayName) }, savedFeed, { children: function (_a) {
            var hovered = _a.hovered, pressed = _a.pressed;
            return (_jsx(View, { style: [commonStyle, (hovered || pressed) && t.atoms.bg_contrast_25], children: _jsxs(FeedCard.Header, { children: [_jsx(FeedCard.Avatar, { src: savedFeed.view.avatar, size: 28 }), _jsx(FeedCard.TitleAndByline, { title: savedFeed.view.displayName }), _jsx(ChevronRight, { size: "sm", fill: t.atoms.text_contrast_low.color })] }) }));
        } }))) : (_jsx(ListCard.Link, __assign({ testID: "saved-feed-".concat(savedFeed.view.name) }, savedFeed, { children: function (_a) {
            var hovered = _a.hovered, pressed = _a.pressed;
            return (_jsx(View, { style: [commonStyle, (hovered || pressed) && t.atoms.bg_contrast_25], children: _jsxs(ListCard.Header, { children: [_jsx(ListCard.Avatar, { src: savedFeed.view.avatar, size: 28 }), _jsx(ListCard.TitleAndByline, { title: savedFeed.view.name }), _jsx(ChevronRight, { size: "sm", fill: t.atoms.text_contrast_low.color })] }) }));
        } })));
}
function SavedFeedPlaceholder() {
    var t = useTheme();
    return (_jsx(View, { style: [
            a.flex_1,
            a.px_lg,
            a.py_md,
            a.border_b,
            t.atoms.border_contrast_low,
        ], children: _jsxs(FeedCard.Header, { children: [_jsx(FeedCard.AvatarPlaceholder, { size: 28 }), _jsx(FeedCard.TitleAndBylinePlaceholder, {})] }) }));
}
function FeedsSavedHeader() {
    var t = useTheme();
    return (_jsxs(View, { style: IS_WEB
            ? [
                a.flex_row,
                a.px_md,
                a.py_lg,
                a.gap_md,
                a.border_b,
                t.atoms.border_contrast_low,
            ]
            : [
                { flexDirection: 'row-reverse' },
                a.p_lg,
                a.gap_md,
                a.border_b,
                t.atoms.border_contrast_low,
            ], children: [_jsx(IconCircle, { icon: ListSparkle_Stroke2_Corner0_Rounded, size: "lg" }), _jsxs(View, { style: [a.flex_1, a.gap_xs], children: [_jsx(Text, { style: [a.flex_1, a.text_2xl, a.font_bold, t.atoms.text], children: _jsx(Trans, { children: "My Feeds" }) }), _jsx(Text, { style: [t.atoms.text_contrast_high], children: _jsx(Trans, { children: "All the feeds you've saved, right in one place." }) })] })] }));
}
function FeedsAboutHeader() {
    var t = useTheme();
    return (_jsxs(View, { style: IS_WEB
            ? [a.flex_row, a.px_md, a.pt_lg, a.pb_lg, a.gap_md]
            : [{ flexDirection: 'row-reverse' }, a.p_lg, a.gap_md], children: [_jsx(IconCircle, { icon: ListMagnifyingGlass_Stroke2_Corner0_Rounded, size: "lg" }), _jsxs(View, { style: [a.flex_1, a.gap_sm], children: [_jsx(Text, { style: [a.flex_1, a.text_2xl, a.font_bold, t.atoms.text], children: _jsx(Trans, { children: "Discover New Feeds" }) }), _jsx(Text, { style: [t.atoms.text_contrast_high], children: _jsx(Trans, { children: "Choose your own timeline! Feeds built by the community help you find content you love." }) })] })] }));
}
var styles = StyleSheet.create({
    contentContainer: {
        paddingBottom: 100,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        paddingHorizontal: 18,
        paddingVertical: 12,
    },
    savedFeed: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    savedFeedMobile: {
        paddingVertical: 10,
    },
    offlineSlug: {
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 4,
        paddingHorizontal: 4,
        paddingVertical: 2,
    },
    headerBtnGroup: {
        flexDirection: 'row',
        gap: 15,
        alignItems: 'center',
    },
});
var templateObject_1, templateObject_2, templateObject_3;
