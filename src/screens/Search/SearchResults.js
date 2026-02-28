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
import { memo, useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Trans, useLingui } from '@lingui/react/macro';
import { urls } from '#/lib/constants';
import { usePostViewTracking } from '#/lib/hooks/usePostViewTracking';
import { cleanError } from '#/lib/strings/errors';
import { augmentSearchQuery } from '#/lib/strings/helpers';
import { useActorSearch } from '#/state/queries/actor-search';
import { usePopularFeedsSearch } from '#/state/queries/feed';
import { useSearchPostsQuery } from '#/state/queries/search-posts';
import { useSession } from '#/state/session';
import { useLoggedOutViewControls } from '#/state/shell/logged-out';
import { useCloseAllActiveElements } from '#/state/util';
import { Pager } from '#/view/com/pager/Pager';
import { TabBar } from '#/view/com/pager/TabBar';
import { Post } from '#/view/com/post/Post';
import { ProfileCardWithFollowBtn } from '#/view/com/profile/ProfileCard';
import { List } from '#/view/com/util/List';
import { atoms as a, useTheme, web } from '#/alf';
import * as FeedCard from '#/components/FeedCard';
import * as Layout from '#/components/Layout';
import { InlineLinkText } from '#/components/Link';
import { ListFooter } from '#/components/Lists';
import { SearchError } from '#/components/SearchError';
import { Text } from '#/components/Typography';
var SearchResults = function (_a) {
    var query = _a.query, queryWithParams = _a.queryWithParams, activeTab = _a.activeTab, onPageSelected = _a.onPageSelected, headerHeight = _a.headerHeight, _b = _a.initialPage, initialPage = _b === void 0 ? 0 : _b;
    var l = useLingui().t;
    var sections = useMemo(function () {
        if (!queryWithParams)
            return [];
        var noParams = queryWithParams === query;
        return [
            {
                title: l(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Top"], ["Top"]))),
                component: (_jsx(SearchScreenPostResults, { query: queryWithParams, sort: "top", active: activeTab === 0 })),
            },
            {
                title: l(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Latest"], ["Latest"]))),
                component: (_jsx(SearchScreenPostResults, { query: queryWithParams, sort: "latest", active: activeTab === 1 })),
            },
            noParams && {
                title: l(templateObject_3 || (templateObject_3 = __makeTemplateObject(["People"], ["People"]))),
                component: (_jsx(SearchScreenUserResults, { query: query, active: activeTab === 2 })),
            },
            noParams && {
                title: l(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Feeds"], ["Feeds"]))),
                component: (_jsx(SearchScreenFeedsResults, { query: query, active: activeTab === 3 })),
            },
        ].filter(Boolean);
    }, [l, query, queryWithParams, activeTab]);
    // There may be fewer tabs after changing the search options.
    var selectedPage = initialPage > sections.length - 1 ? 0 : initialPage;
    return (_jsx(Pager, { onPageSelected: onPageSelected, renderTabBar: function (props) { return (_jsx(Layout.Center, { style: [a.z_10, web([a.sticky, { top: headerHeight }])], children: _jsx(TabBar, __assign({ items: sections.map(function (section) { return section.title; }) }, props)) })); }, initialPage: selectedPage, children: sections.map(function (section, i) { return (_jsx(View, { children: section.component }, i)); }) }));
};
SearchResults = memo(SearchResults);
export { SearchResults };
function Loader() {
    return (_jsx(Layout.Content, { children: _jsx(View, { style: [a.py_xl], children: _jsx(ActivityIndicator, {}) }) }));
}
function EmptyState(_a) {
    var messageText = _a.messageText, error = _a.error, children = _a.children;
    var t = useTheme();
    return (_jsx(Layout.Content, { children: _jsx(View, { style: [a.p_xl], children: _jsxs(View, { style: [t.atoms.bg_contrast_25, a.rounded_sm, a.p_lg], children: [_jsx(Text, { style: [a.text_md], children: messageText }), error && (_jsxs(_Fragment, { children: [_jsx(View, { style: [
                                    {
                                        marginVertical: 12,
                                        height: 1,
                                        width: '100%',
                                        backgroundColor: t.atoms.text.color,
                                        opacity: 0.2,
                                    },
                                ] }), _jsx(Text, { style: [t.atoms.text_contrast_medium], children: _jsxs(Trans, { children: ["Error: ", error] }) })] })), children] }) }) }));
}
function NoResultsText(_a) {
    var query = _a.query;
    var t = useTheme();
    var l = useLingui().t;
    return (_jsxs(_Fragment, { children: [_jsx(Text, { style: [a.text_lg, t.atoms.text_contrast_high], children: _jsxs(Trans, { children: ["No results found for \u201C", _jsx(Text, { style: [a.text_lg, t.atoms.text, a.font_medium], children: query }), "\u201D."] }) }), '\n\n', _jsx(Text, { style: [a.text_md, a.leading_snug, t.atoms.text_contrast_high], children: _jsxs(Trans, { context: "english-only-resource", children: ["Try a different search term, or", ' ', _jsx(InlineLinkText, { label: l({
                                message: 'read about how to use search filters',
                                context: 'english-only-resource',
                            }), to: urls.website.blog.searchTipsAndTricks, style: [a.text_md, a.leading_snug], children: "read about how to use search filters" }), "."] }) })] }));
}
var SearchScreenPostResults = function (_a) {
    var query = _a.query, sort = _a.sort, active = _a.active;
    var l = useLingui().t;
    var _b = useSession(), currentAccount = _b.currentAccount, hasSession = _b.hasSession;
    var _c = useState(false), isPTR = _c[0], setIsPTR = _c[1];
    var trackPostView = usePostViewTracking('SearchResults');
    var augmentedQuery = useMemo(function () {
        return augmentSearchQuery(query || '', { did: currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did });
    }, [query, currentAccount]);
    var _d = useSearchPostsQuery({ query: augmentedQuery, sort: sort, enabled: active }), isFetched = _d.isFetched, results = _d.data, isFetching = _d.isFetching, error = _d.error, refetch = _d.refetch, fetchNextPage = _d.fetchNextPage, isFetchingNextPage = _d.isFetchingNextPage, hasNextPage = _d.hasNextPage;
    var t = useTheme();
    var onPullToRefresh = useCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsPTR(true);
                    return [4 /*yield*/, refetch()];
                case 1:
                    _a.sent();
                    setIsPTR(false);
                    return [2 /*return*/];
            }
        });
    }); }, [setIsPTR, refetch]);
    var onEndReached = useCallback(function () {
        if (isFetching || !hasNextPage || error)
            return;
        void fetchNextPage();
    }, [isFetching, error, hasNextPage, fetchNextPage]);
    var posts = useMemo(function () {
        return (results === null || results === void 0 ? void 0 : results.pages.flatMap(function (page) { return page.posts; })) || [];
    }, [results]);
    var items = useMemo(function () {
        var temp = [];
        var seenUris = new Set();
        for (var _i = 0, posts_1 = posts; _i < posts_1.length; _i++) {
            var post = posts_1[_i];
            if (seenUris.has(post.uri)) {
                continue;
            }
            temp.push({
                type: 'post',
                key: post.uri,
                post: post,
            });
            seenUris.add(post.uri);
        }
        if (isFetchingNextPage) {
            temp.push({
                type: 'loadingMore',
                key: 'loadingMore',
            });
        }
        return temp;
    }, [posts, isFetchingNextPage]);
    var closeAllActiveElements = useCloseAllActiveElements();
    var requestSwitchToAccount = useLoggedOutViewControls().requestSwitchToAccount;
    var showSignIn = function () {
        closeAllActiveElements();
        requestSwitchToAccount({ requestedAccount: 'none' });
    };
    var showCreateAccount = function () {
        closeAllActiveElements();
        requestSwitchToAccount({ requestedAccount: 'new' });
    };
    if (!hasSession) {
        return (_jsx(SearchError, { title: l(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Search is currently unavailable when logged out"], ["Search is currently unavailable when logged out"]))), children: _jsx(Text, { style: [a.text_md, a.text_center, a.leading_snug], children: _jsxs(Trans, { children: [_jsx(InlineLinkText, { label: l(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Sign in"], ["Sign in"]))), to: '#', onPress: showSignIn, children: "Sign in" }), _jsx(Text, { style: t.atoms.text_contrast_medium, children: " or " }), _jsx(InlineLinkText, { label: l(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Create an account"], ["Create an account"]))), to: '#', onPress: showCreateAccount, children: "create an account" }), _jsx(Text, { children: " " }), _jsx(Text, { style: t.atoms.text_contrast_medium, children: "to search for news, sports, politics, and everything else happening on Bluesky." })] }) }) }));
    }
    return error ? (_jsx(EmptyState, { messageText: l(templateObject_8 || (templateObject_8 = __makeTemplateObject(["We're sorry, but your search could not be completed. Please try again in a few minutes."], ["We're sorry, but your search could not be completed. Please try again in a few minutes."]))), error: cleanError(error) })) : (_jsx(_Fragment, { children: isFetched ? (_jsx(_Fragment, { children: posts.length ? (_jsx(List, { data: items, renderItem: function (_a) {
                    var item = _a.item;
                    if (item.type === 'post') {
                        return _jsx(Post, { post: item.post });
                    }
                    else {
                        return null;
                    }
                }, keyExtractor: function (item) { return item.key; }, refreshing: isPTR, onRefresh: function () {
                    void onPullToRefresh();
                }, onEndReached: onEndReached, onItemSeen: function (item) {
                    if (item.type === 'post') {
                        trackPostView(item.post);
                    }
                }, desktopFixedHeight: true, ListFooterComponent: _jsx(ListFooter, { isFetchingNextPage: isFetchingNextPage, hasNextPage: hasNextPage }) })) : (_jsx(EmptyState, { messageText: _jsx(NoResultsText, { query: query }) })) })) : (_jsx(Loader, {})) }));
};
SearchScreenPostResults = memo(SearchScreenPostResults);
var SearchScreenUserResults = function (_a) {
    var query = _a.query, active = _a.active;
    var l = useLingui().t;
    var hasSession = useSession().hasSession;
    var _b = useState(false), isPTR = _b[0], setIsPTR = _b[1];
    var _c = useActorSearch({
        query: query,
        enabled: active,
    }), isFetched = _c.isFetched, results = _c.data, isFetching = _c.isFetching, error = _c.error, refetch = _c.refetch, fetchNextPage = _c.fetchNextPage, isFetchingNextPage = _c.isFetchingNextPage, hasNextPage = _c.hasNextPage;
    var onPullToRefresh = useCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsPTR(true);
                    return [4 /*yield*/, refetch()];
                case 1:
                    _a.sent();
                    setIsPTR(false);
                    return [2 /*return*/];
            }
        });
    }); }, [setIsPTR, refetch]);
    var onEndReached = useCallback(function () {
        if (!hasSession)
            return;
        if (isFetching || !hasNextPage || error)
            return;
        void fetchNextPage();
    }, [isFetching, error, hasNextPage, fetchNextPage, hasSession]);
    var profiles = useMemo(function () {
        return (results === null || results === void 0 ? void 0 : results.pages.flatMap(function (page) { return page.actors; })) || [];
    }, [results]);
    if (error) {
        return (_jsx(EmptyState, { messageText: l(templateObject_9 || (templateObject_9 = __makeTemplateObject(["We\u2019re sorry, but your search could not be completed. Please try again in a few minutes."], ["We\u2019re sorry, but your search could not be completed. Please try again in a few minutes."]))), error: error.toString() }));
    }
    return isFetched && profiles ? (_jsx(_Fragment, { children: profiles.length ? (_jsx(List, { data: profiles, renderItem: function (_a) {
                var item = _a.item;
                return (_jsx(ProfileCardWithFollowBtn, { profile: item }));
            }, keyExtractor: function (item) { return item.did; }, refreshing: isPTR, onRefresh: function () { return void onPullToRefresh(); }, onEndReached: onEndReached, desktopFixedHeight: true, ListFooterComponent: _jsx(ListFooter, { hasNextPage: hasNextPage && hasSession, isFetchingNextPage: isFetchingNextPage }) })) : (_jsx(EmptyState, { messageText: _jsx(NoResultsText, { query: query }) })) })) : (_jsx(Loader, {}));
};
SearchScreenUserResults = memo(SearchScreenUserResults);
var SearchScreenFeedsResults = function (_a) {
    var query = _a.query, active = _a.active;
    var t = useTheme();
    var _b = usePopularFeedsSearch({
        query: query,
        enabled: active,
    }), results = _b.data, isFetched = _b.isFetched;
    return isFetched && results ? (_jsx(_Fragment, { children: results.length ? (_jsx(List, { data: results, renderItem: function (_a) {
                var item = _a.item;
                return (_jsx(View, { style: [
                        a.border_t,
                        t.atoms.border_contrast_low,
                        a.px_lg,
                        a.py_lg,
                    ], children: _jsx(FeedCard.Default, { view: item }) }));
            }, keyExtractor: function (item) { return item.uri; }, desktopFixedHeight: true, ListFooterComponent: _jsx(ListFooter, {}) })) : (_jsx(EmptyState, { messageText: _jsx(NoResultsText, { query: query }) })) })) : (_jsx(Loader, {}));
};
SearchScreenFeedsResults = memo(SearchScreenFeedsResults);
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9;
