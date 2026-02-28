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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
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
import { memo, useCallback, useLayoutEffect, useMemo, useRef, useState, } from 'react';
import { View, } from 'react-native';
import { Trans, useLingui } from '@lingui/react/macro';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { HITSLOP_10, HITSLOP_20 } from '#/lib/constants';
import { useNonReactiveCallback } from '#/lib/hooks/useNonReactiveCallback';
import { MagnifyingGlassIcon } from '#/lib/icons';
import { listenSoftReset } from '#/state/events';
import { useActorAutocompleteQuery } from '#/state/queries/actor-autocomplete';
import { unstableCacheProfileView, useProfilesQuery, } from '#/state/queries/profile';
import { useSession } from '#/state/session';
import { useSetMinimalShellMode } from '#/state/shell';
import { makeSearchQuery, parseSearchQuery, } from '#/screens/Search/utils';
import { atoms as a, tokens, useBreakpoints, useTheme, web } from '#/alf';
import { Button, ButtonText } from '#/components/Button';
import { SearchInput } from '#/components/forms/SearchInput';
import * as Layout from '#/components/Layout';
import { Text } from '#/components/Typography';
import { IS_WEB } from '#/env';
import { account, useStorage } from '#/storage';
import { AutocompleteResults } from './components/AutocompleteResults';
import { SearchHistory } from './components/SearchHistory';
import { SearchLanguageDropdown } from './components/SearchLanguageDropdown';
import { Explore } from './Explore';
import { SearchResults } from './SearchResults';
// Map tab parameter to tab index
function getTabIndex(tabParam) {
    switch (tabParam) {
        case 'feed':
            return 3; // Feeds tab
        case 'user':
        case 'profile':
            return 2; // People tab
        case 'latest':
            return 1; // Latest tab
        default:
            return 0; // Top tab
    }
}
export function SearchScreenShell(_a) {
    var _b, _c, _d;
    var queryParam = _a.queryParam, testID = _a.testID, fixedParams = _a.fixedParams, _e = _a.navButton, navButton = _e === void 0 ? 'menu' : _e, inputPlaceholder = _a.inputPlaceholder, isExplore = _a.isExplore;
    var t = useTheme();
    var gtMobile = useBreakpoints().gtMobile;
    var navigation = useNavigation();
    var route = useRoute();
    var textInput = useRef(null);
    var l = useLingui().t;
    var setMinimalShellMode = useSetMinimalShellMode();
    var currentAccount = useSession().currentAccount;
    var queryClient = useQueryClient();
    // Get tab parameter from route params
    var tabParam = (_b = route.params) === null || _b === void 0 ? void 0 : _b.tab;
    var _f = useState(function () { return getTabIndex(tabParam); }), activeTab = _f[0], setActiveTab = _f[1];
    // Query terms
    var _g = useState(queryParam), searchText = _g[0], setSearchText = _g[1];
    var _h = useActorAutocompleteQuery(searchText, true), autocompleteData = _h.data, isAutocompleteFetching = _h.isFetching;
    var _j = useState(false), showAutocomplete = _j[0], setShowAutocomplete = _j[1];
    var _k = useStorage(account, [
        (_c = currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did) !== null && _c !== void 0 ? _c : 'pwi',
        'searchTermHistory',
    ]), _l = _k[0], termHistory = _l === void 0 ? [] : _l, setTermHistory = _k[1];
    var _m = useStorage(account, [
        (_d = currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did) !== null && _d !== void 0 ? _d : 'pwi',
        'searchAccountHistory',
    ]), _o = _m[0], accountHistory = _o === void 0 ? [] : _o, setAccountHistory = _m[1];
    var accountHistoryProfiles = useProfilesQuery({
        handles: accountHistory,
        maintainData: true,
    }).data;
    var updateSearchHistory = useCallback(function (item) {
        if (!item)
            return;
        var newSearchHistory = __spreadArray([
            item
        ], termHistory.filter(function (search) { return search !== item; }), true).slice(0, 6);
        setTermHistory(newSearchHistory);
    }, [termHistory, setTermHistory]);
    var updateProfileHistory = useCallback(function (item) {
        var newAccountHistory = __spreadArray([
            item.did
        ], accountHistory.filter(function (p) { return p !== item.did; }), true).slice(0, 10);
        setAccountHistory(newAccountHistory);
    }, [accountHistory, setAccountHistory]);
    var deleteSearchHistoryItem = useCallback(function (item) {
        setTermHistory(termHistory.filter(function (search) { return search !== item; }));
    }, [termHistory, setTermHistory]);
    var deleteProfileHistoryItem = useCallback(function (item) {
        setAccountHistory(accountHistory.filter(function (p) { return p !== item.did; }));
    }, [accountHistory, setAccountHistory]);
    var _p = useQueryManager({
        initialQuery: queryParam,
        fixedParams: fixedParams,
    }), params = _p.params, query = _p.query, queryWithParams = _p.queryWithParams;
    var showFilters = Boolean(queryWithParams && !showAutocomplete);
    // web only - measure header height for sticky positioning
    var _r = useState(0), headerHeight = _r[0], setHeaderHeight = _r[1];
    var headerRef = useRef(null);
    useLayoutEffect(function () {
        if (IS_WEB) {
            if (!headerRef.current)
                return;
            var measurement = headerRef.current.getBoundingClientRect();
            setHeaderHeight(measurement.height);
        }
    }, []);
    useFocusEffect(useNonReactiveCallback(function () {
        if (IS_WEB) {
            setSearchText(queryParam);
        }
    }));
    var onPressClearQuery = useCallback(function () {
        var _a;
        scrollToTopWeb();
        setSearchText('');
        (_a = textInput.current) === null || _a === void 0 ? void 0 : _a.focus();
    }, []);
    var onChangeText = useCallback(function (text) {
        scrollToTopWeb();
        setSearchText(text);
    }, []);
    var navigateToItem = useCallback(function (item) {
        var _a;
        scrollToTopWeb();
        setShowAutocomplete(false);
        updateSearchHistory(item);
        if (IS_WEB) {
            // @ts-expect-error route is not typesafe
            navigation.push(route.name, __assign(__assign({}, route.params), { q: item }));
        }
        else {
            (_a = textInput.current) === null || _a === void 0 ? void 0 : _a.blur();
            navigation.setParams({ q: item });
        }
    }, [updateSearchHistory, navigation, route]);
    var onPressCancelSearch = useCallback(function () {
        var _a, _b;
        scrollToTopWeb();
        (_a = textInput.current) === null || _a === void 0 ? void 0 : _a.blur();
        setShowAutocomplete(false);
        if (IS_WEB) {
            // Empty params resets the URL to be /search rather than /search?q=
            // Also clear the tab parameter
            var _c = ((_b = route.params) !== null && _b !== void 0 ? _b : {}), _q = _c.q, _tab = _c.tab, parameters = __rest(_c, ["q", "tab"]);
            // @ts-expect-error route is not typesafe
            navigation.replace(route.name, parameters);
        }
        else {
            setSearchText('');
            navigation.setParams({ q: '', tab: undefined });
        }
    }, [setShowAutocomplete, setSearchText, navigation, route.params, route.name]);
    var onSubmit = useCallback(function () {
        navigateToItem(searchText);
    }, [navigateToItem, searchText]);
    var onAutocompleteResultPress = useCallback(function () {
        var _a;
        if (IS_WEB) {
            setShowAutocomplete(false);
        }
        else {
            (_a = textInput.current) === null || _a === void 0 ? void 0 : _a.blur();
        }
    }, []);
    var handleHistoryItemClick = useCallback(function (item) {
        setSearchText(item);
        navigateToItem(item);
    }, [navigateToItem]);
    var handleProfileClick = useCallback(function (profile) {
        unstableCacheProfileView(queryClient, profile);
        // Slight delay to avoid updating during push nav animation.
        setTimeout(function () {
            updateProfileHistory(profile);
        }, 400);
    }, [updateProfileHistory, queryClient]);
    var onSoftReset = useCallback(function () {
        var _a, _b;
        if (IS_WEB) {
            // Empty params resets the URL to be /search rather than /search?q=
            // Also clear the tab parameter when soft resetting
            var _c = ((_a = route.params) !== null && _a !== void 0 ? _a : {}), _q = _c.q, _tab = _c.tab, parameters = __rest(_c, ["q", "tab"]);
            // @ts-expect-error route is not typesafe
            navigation.replace(route.name, parameters);
        }
        else {
            setSearchText('');
            navigation.setParams({ q: '', tab: undefined });
            (_b = textInput.current) === null || _b === void 0 ? void 0 : _b.focus();
        }
    }, [navigation, route]);
    useFocusEffect(useCallback(function () {
        setMinimalShellMode(false);
        return listenSoftReset(onSoftReset);
    }, [onSoftReset, setMinimalShellMode]));
    var onSearchInputFocus = useCallback(function () {
        if (IS_WEB) {
            // Prevent a jump on iPad by ensuring that
            // the initial focused render has no result list.
            requestAnimationFrame(function () {
                setShowAutocomplete(true);
            });
        }
        else {
            setShowAutocomplete(true);
        }
    }, [setShowAutocomplete]);
    var focusSearchInput = useCallback(function (tab) {
        var _a;
        (_a = textInput.current) === null || _a === void 0 ? void 0 : _a.focus();
        // If a tab is specified, set the tab parameter
        if (tab) {
            if (IS_WEB) {
                navigation.setParams(__assign(__assign({}, route.params), { tab: tab }));
            }
            else {
                navigation.setParams({ tab: tab });
            }
        }
    }, [navigation, route]);
    var showHeader = !gtMobile || navButton !== 'menu';
    return (_jsxs(Layout.Screen, { testID: testID, children: [_jsx(View, { ref: headerRef, onLayout: function (evt) {
                    if (IS_WEB)
                        setHeaderHeight(evt.nativeEvent.layout.height);
                }, style: [
                    a.relative,
                    a.z_10,
                    web({
                        position: 'sticky',
                        top: 0,
                    }),
                ], children: _jsxs(Layout.Center, { style: t.atoms.bg, children: [showHeader && (_jsx(View
                        // HACK: shift up search input. we can't remove the top padding
                        // on the search input because it messes up the layout animation
                        // if we add it only when the header is hidden
                        , { 
                            // HACK: shift up search input. we can't remove the top padding
                            // on the search input because it messes up the layout animation
                            // if we add it only when the header is hidden
                            style: { marginBottom: tokens.space.xs * -1 }, children: _jsxs(Layout.Header.Outer, { noBottomBorder: true, children: [navButton === 'menu' ? (_jsx(Layout.Header.MenuButton, {})) : (_jsx(Layout.Header.BackButton, {})), _jsx(Layout.Header.Content, { align: "left", children: _jsx(Layout.Header.TitleText, { children: isExplore ? _jsx(Trans, { children: "Explore" }) : _jsx(Trans, { children: "Search" }) }) }), showFilters ? (_jsx(SearchLanguageDropdown, { value: params.lang, onChange: params.setLang })) : (_jsx(Layout.Header.Slot, {}))] }) })), _jsx(View, { style: [a.px_lg, a.pt_sm, a.pb_sm, a.overflow_hidden], children: _jsxs(View, { style: [a.gap_sm], children: [_jsxs(View, { style: [a.w_full, a.flex_row, a.align_stretch, a.gap_xs], children: [_jsx(View, { style: [a.flex_1], children: _jsx(SearchInput, { ref: textInput, value: searchText, onFocus: onSearchInputFocus, onChangeText: onChangeText, onClearText: onPressClearQuery, onSubmitEditing: onSubmit, placeholder: inputPlaceholder !== null && inputPlaceholder !== void 0 ? inputPlaceholder : l(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Search for posts, users, or feeds"], ["Search for posts, users, or feeds"]))), hitSlop: __assign(__assign({}, HITSLOP_20), { top: 0 }) }) }), showAutocomplete && (_jsx(Button, { label: l(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Cancel search"], ["Cancel search"]))), size: "large", variant: "ghost", color: "secondary", shape: "rectangular", style: [a.px_sm], onPress: onPressCancelSearch, hitSlop: HITSLOP_10, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Cancel" }) }) }))] }), showFilters && !showHeader && (_jsx(View, { style: [
                                            a.flex_row,
                                            a.align_center,
                                            a.justify_between,
                                            a.gap_sm,
                                        ], children: _jsx(SearchLanguageDropdown, { value: params.lang, onChange: params.setLang }) }))] }) })] }) }), _jsx(View, { style: {
                    display: showAutocomplete && !fixedParams ? 'flex' : 'none',
                    flex: 1,
                }, children: searchText.length > 0 ? (_jsx(AutocompleteResults, { isAutocompleteFetching: isAutocompleteFetching, autocompleteData: autocompleteData, searchText: searchText, onSubmit: onSubmit, onResultPress: onAutocompleteResultPress, onProfileClick: handleProfileClick })) : (_jsx(SearchHistory, { searchHistory: termHistory, selectedProfiles: (accountHistoryProfiles === null || accountHistoryProfiles === void 0 ? void 0 : accountHistoryProfiles.profiles) || [], onItemClick: handleHistoryItemClick, onProfileClick: handleProfileClick, onRemoveItemClick: deleteSearchHistoryItem, onRemoveProfileClick: deleteProfileHistoryItem })) }), _jsx(View, { style: {
                    display: showAutocomplete ? 'none' : 'flex',
                    flex: 1,
                }, children: _jsx(SearchScreenInner, { activeTab: activeTab, setActiveTab: setActiveTab, query: query, queryWithParams: queryWithParams, headerHeight: headerHeight, focusSearchInput: focusSearchInput }, params.lang) })] }));
}
var SearchScreenInner = function (_a) {
    var activeTab = _a.activeTab, setActiveTab = _a.setActiveTab, query = _a.query, queryWithParams = _a.queryWithParams, headerHeight = _a.headerHeight, focusSearchInput = _a.focusSearchInput;
    var t = useTheme();
    var setMinimalShellMode = useSetMinimalShellMode();
    var hasSession = useSession().hasSession;
    var gtTablet = useBreakpoints().gtTablet;
    var onPageSelected = useCallback(function (index) {
        setMinimalShellMode(false);
        setActiveTab(index);
    }, [setActiveTab, setMinimalShellMode]);
    return queryWithParams ? (_jsx(SearchResults, { query: query, queryWithParams: queryWithParams, activeTab: activeTab, headerHeight: headerHeight, onPageSelected: onPageSelected, initialPage: activeTab })) : hasSession ? (_jsx(Explore, { focusSearchInput: focusSearchInput, headerHeight: headerHeight })) : (_jsx(Layout.Center, { children: _jsxs(View, { style: a.flex_1, children: [gtTablet && (_jsx(View, { style: [
                        a.border_b,
                        t.atoms.border_contrast_low,
                        a.px_lg,
                        a.pt_sm,
                        a.pb_lg,
                    ], children: _jsx(Text, { style: [a.text_2xl, a.font_bold], children: _jsx(Trans, { children: "Search" }) }) })), _jsxs(View, { style: [a.align_center, a.justify_center, a.py_4xl, a.gap_lg], children: [_jsx(MagnifyingGlassIcon, { strokeWidth: 3, size: 60, style: t.atoms.text_contrast_medium }), _jsx(Text, { style: [t.atoms.text_contrast_medium, a.text_md], children: _jsx(Trans, { children: "Find posts, users, and feeds on Bluesky" }) })] })] }) }));
};
SearchScreenInner = memo(SearchScreenInner);
function useQueryManager(_a) {
    var initialQuery = _a.initialQuery, fixedParams = _a.fixedParams;
    var _b = useMemo(function () {
        return parseSearchQuery(initialQuery || '');
    }, [initialQuery]), query = _b.query, initialParams = _b.params;
    var _c = useState(initialQuery), prevInitialQuery = _c[0], setPrevInitialQuery = _c[1];
    var _d = useState(initialParams.lang || ''), lang = _d[0], setLang = _d[1];
    if (initialQuery !== prevInitialQuery) {
        // handle new queryParam change (from manual search entry)
        setPrevInitialQuery(initialQuery);
        setLang(initialParams.lang || '');
    }
    var params = useMemo(function () { return (__assign(__assign(__assign({}, initialParams), { 
        // managed stuff
        lang: lang }), fixedParams)); }, [lang, initialParams, fixedParams]);
    var handlers = useMemo(function () { return ({
        setLang: setLang,
    }); }, [setLang]);
    return useMemo(function () {
        return {
            query: query,
            queryWithParams: makeSearchQuery(query, params),
            params: __assign(__assign({}, params), handlers),
        };
    }, [query, params, handlers]);
}
function scrollToTopWeb() {
    if (IS_WEB) {
        window.scrollTo(0, 0);
    }
}
var templateObject_1, templateObject_2;
