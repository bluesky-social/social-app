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
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { HITSLOP_20 } from '#/lib/constants';
import { HITSLOP_10 } from '#/lib/constants';
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
export function SearchScreenShell(_a) {
    var _this = this;
    var _b, _c;
    var queryParam = _a.queryParam, testID = _a.testID, fixedParams = _a.fixedParams, _d = _a.navButton, navButton = _d === void 0 ? 'menu' : _d, inputPlaceholder = _a.inputPlaceholder, isExplore = _a.isExplore;
    var t = useTheme();
    var gtMobile = useBreakpoints().gtMobile;
    var navigation = useNavigation();
    var route = useRoute();
    var textInput = useRef(null);
    var _ = useLingui()._;
    var setMinimalShellMode = useSetMinimalShellMode();
    var currentAccount = useSession().currentAccount;
    var queryClient = useQueryClient();
    // Query terms
    var _e = useState(queryParam), searchText = _e[0], setSearchText = _e[1];
    var _f = useActorAutocompleteQuery(searchText, true), autocompleteData = _f.data, isAutocompleteFetching = _f.isFetching;
    var _g = useState(false), showAutocomplete = _g[0], setShowAutocomplete = _g[1];
    var _h = useStorage(account, [
        (_b = currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did) !== null && _b !== void 0 ? _b : 'pwi',
        'searchTermHistory',
    ]), _j = _h[0], termHistory = _j === void 0 ? [] : _j, setTermHistory = _h[1];
    var _k = useStorage(account, [
        (_c = currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did) !== null && _c !== void 0 ? _c : 'pwi',
        'searchAccountHistory',
    ]), _l = _k[0], accountHistory = _l === void 0 ? [] : _l, setAccountHistory = _k[1];
    var accountHistoryProfiles = useProfilesQuery({
        handles: accountHistory,
        maintainData: true,
    }).data;
    var updateSearchHistory = useCallback(function (item) { return __awaiter(_this, void 0, void 0, function () {
        var newSearchHistory;
        return __generator(this, function (_a) {
            if (!item)
                return [2 /*return*/];
            newSearchHistory = __spreadArray([
                item
            ], termHistory.filter(function (search) { return search !== item; }), true).slice(0, 6);
            setTermHistory(newSearchHistory);
            return [2 /*return*/];
        });
    }); }, [termHistory, setTermHistory]);
    var updateProfileHistory = useCallback(function (item) { return __awaiter(_this, void 0, void 0, function () {
        var newAccountHistory;
        return __generator(this, function (_a) {
            newAccountHistory = __spreadArray([
                item.did
            ], accountHistory.filter(function (p) { return p !== item.did; }), true).slice(0, 10);
            setAccountHistory(newAccountHistory);
            return [2 /*return*/];
        });
    }); }, [accountHistory, setAccountHistory]);
    var deleteSearchHistoryItem = useCallback(function (item) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            setTermHistory(termHistory.filter(function (search) { return search !== item; }));
            return [2 /*return*/];
        });
    }); }, [termHistory, setTermHistory]);
    var deleteProfileHistoryItem = useCallback(function (item) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            setAccountHistory(accountHistory.filter(function (p) { return p !== item.did; }));
            return [2 /*return*/];
        });
    }); }, [accountHistory, setAccountHistory]);
    var _m = useQueryManager({
        initialQuery: queryParam,
        fixedParams: fixedParams,
    }), params = _m.params, query = _m.query, queryWithParams = _m.queryWithParams;
    var showFilters = Boolean(queryWithParams && !showAutocomplete);
    // web only - measure header height for sticky positioning
    var _o = useState(0), headerHeight = _o[0], setHeaderHeight = _o[1];
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
    var onChangeText = useCallback(function (text) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            scrollToTopWeb();
            setSearchText(text);
            return [2 /*return*/];
        });
    }); }, []);
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
                            style: { marginBottom: tokens.space.xs * -1 }, children: _jsxs(Layout.Header.Outer, { noBottomBorder: true, children: [navButton === 'menu' ? (_jsx(Layout.Header.MenuButton, {})) : (_jsx(Layout.Header.BackButton, {})), _jsx(Layout.Header.Content, { align: "left", children: _jsx(Layout.Header.TitleText, { children: isExplore ? _jsx(Trans, { children: "Explore" }) : _jsx(Trans, { children: "Search" }) }) }), showFilters ? (_jsx(SearchLanguageDropdown, { value: params.lang, onChange: params.setLang })) : (_jsx(Layout.Header.Slot, {}))] }) })), _jsx(View, { style: [a.px_lg, a.pt_sm, a.pb_sm, a.overflow_hidden], children: _jsxs(View, { style: [a.gap_sm], children: [_jsxs(View, { style: [a.w_full, a.flex_row, a.align_stretch, a.gap_xs], children: [_jsx(View, { style: [a.flex_1], children: _jsx(SearchInput, { ref: textInput, value: searchText, onFocus: onSearchInputFocus, onChangeText: onChangeText, onClearText: onPressClearQuery, onSubmitEditing: onSubmit, placeholder: inputPlaceholder !== null && inputPlaceholder !== void 0 ? inputPlaceholder : _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Search for posts, users, or feeds"], ["Search for posts, users, or feeds"])))), hitSlop: __assign(__assign({}, HITSLOP_20), { top: 0 }) }) }), showAutocomplete && (_jsx(Button, { label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Cancel search"], ["Cancel search"])))), size: "large", variant: "ghost", color: "secondary", shape: "rectangular", style: [a.px_sm], onPress: onPressCancelSearch, hitSlop: HITSLOP_10, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Cancel" }) }) }))] }), showFilters && !showHeader && (_jsx(View, { style: [
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
                }, children: _jsx(SearchScreenInner, { query: query, queryWithParams: queryWithParams, headerHeight: headerHeight, focusSearchInput: focusSearchInput }) })] }));
}
var SearchScreenInner = function (_a) {
    var _b;
    var query = _a.query, queryWithParams = _a.queryWithParams, headerHeight = _a.headerHeight, focusSearchInput = _a.focusSearchInput;
    var t = useTheme();
    var setMinimalShellMode = useSetMinimalShellMode();
    var hasSession = useSession().hasSession;
    var gtTablet = useBreakpoints().gtTablet;
    var route = useRoute();
    // Get tab parameter from route params
    var tabParam = (_b = route.params) === null || _b === void 0 ? void 0 : _b.tab;
    // Map tab parameter to tab index
    var getInitialTabIndex = useCallback(function () {
        if (!tabParam)
            return 0;
        switch (tabParam) {
            case 'user':
            case 'profile':
                return 2; // People tab
            case 'feed':
                return 3; // Feeds tab
            default:
                return 0;
        }
    }, [tabParam]);
    var _c = useState(getInitialTabIndex()), activeTab = _c[0], setActiveTab = _c[1];
    // Update activeTab when tabParam changes
    useLayoutEffect(function () {
        var newTabIndex = getInitialTabIndex();
        if (newTabIndex !== activeTab) {
            setActiveTab(newTabIndex);
        }
    }, [tabParam, activeTab, getInitialTabIndex]);
    var onPageSelected = useCallback(function (index) {
        setMinimalShellMode(false);
        setActiveTab(index);
    }, [setMinimalShellMode]);
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
