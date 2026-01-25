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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TextInput, useWindowDimensions, View, } from 'react-native';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { popularInterests, useInterestsDisplayNames } from '#/lib/interests';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useActorSearch } from '#/state/queries/actor-search';
import { usePreferencesQuery } from '#/state/queries/preferences';
import { useGetSuggestedUsersQuery } from '#/state/queries/trending/useGetSuggestedUsersQuery';
import { useSession } from '#/state/session';
import { atoms as a, native, useBreakpoints, useTheme, web, } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { useInteractionState } from '#/components/hooks/useInteractionState';
import { ArrowRight_Stroke2_Corner0_Rounded as ArrowRightIcon } from '#/components/icons/Arrow';
import { MagnifyingGlass_Stroke2_Corner0_Rounded as SearchIcon } from '#/components/icons/MagnifyingGlass';
import { TimesLarge_Stroke2_Corner0_Rounded as X } from '#/components/icons/Times';
import { boostInterests, InterestTabs } from '#/components/InterestTabs';
import * as ProfileCard from '#/components/ProfileCard';
import { Text } from '#/components/Typography';
import { useAnalytics } from '#/analytics';
import { IS_WEB } from '#/env';
import { ProgressGuideTask } from './Task';
export function FollowDialog(_a) {
    var guide = _a.guide, showArrow = _a.showArrow;
    var ax = useAnalytics();
    var _ = useLingui()._;
    var control = Dialog.useDialogControl();
    var gtPhone = useBreakpoints().gtPhone;
    var minHeight = useWindowDimensions().height;
    return (_jsxs(_Fragment, { children: [_jsxs(Button, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Find people to follow"], ["Find people to follow"])))), onPress: function () {
                    control.open();
                    ax.metric('progressGuide:followDialog:open', {});
                }, size: gtPhone ? 'small' : 'large', color: "primary", children: [_jsx(ButtonText, { children: _jsx(Trans, { children: "Find people to follow" }) }), showArrow && _jsx(ButtonIcon, { icon: ArrowRightIcon })] }), _jsxs(Dialog.Outer, { control: control, nativeOptions: { minHeight: minHeight }, children: [_jsx(Dialog.Handle, {}), _jsx(DialogInner, { guide: guide })] })] }));
}
/**
 * Same as {@link FollowDialog} but without a progress guide.
 */
export function FollowDialogWithoutGuide(_a) {
    var control = _a.control;
    var minHeight = useWindowDimensions().height;
    return (_jsxs(Dialog.Outer, { control: control, nativeOptions: { minHeight: minHeight }, children: [_jsx(Dialog.Handle, {}), _jsx(DialogInner, {})] }));
}
// Fine to keep this top-level.
var lastSelectedInterest = '';
var lastSearchText = '';
function DialogInner(_a) {
    var _b;
    var guide = _a.guide;
    var _ = useLingui()._;
    var ax = useAnalytics();
    var interestsDisplayNames = useInterestsDisplayNames();
    var preferences = usePreferencesQuery().data;
    var personalizedInterests = (_b = preferences === null || preferences === void 0 ? void 0 : preferences.interests) === null || _b === void 0 ? void 0 : _b.tags;
    var interests = Object.keys(interestsDisplayNames)
        .sort(boostInterests(popularInterests))
        .sort(boostInterests(personalizedInterests));
    var _c = useState(function () {
        return lastSelectedInterest ||
            (personalizedInterests && interests.includes(personalizedInterests[0])
                ? personalizedInterests[0]
                : interests[0]);
    }), selectedInterest = _c[0], setSelectedInterest = _c[1];
    var _d = useState(lastSearchText), searchText = _d[0], setSearchText = _d[1];
    var moderationOpts = useModerationOpts();
    var listRef = useRef(null);
    var inputRef = useRef(null);
    var _e = useState(0), headerHeight = _e[0], setHeaderHeight = _e[1];
    var currentAccount = useSession().currentAccount;
    useEffect(function () {
        lastSearchText = searchText;
        lastSelectedInterest = selectedInterest;
    }, [searchText, selectedInterest]);
    var _f = useGetSuggestedUsersQuery({
        category: selectedInterest,
        limit: 50,
    }), suggestions = _f.data, isFetchingSuggestions = _f.isFetching, suggestionsError = _f.error;
    var _g = useActorSearch({
        enabled: !!searchText,
        query: searchText,
    }), searchResults = _g.data, isFetchingSearchResults = _g.isFetching, searchResultsError = _g.error, isSearchResultsError = _g.isError;
    var hasSearchText = !!searchText;
    var resultsKey = searchText || selectedInterest;
    var items = useMemo(function () {
        var _a;
        var results = hasSearchText
            ? searchResults === null || searchResults === void 0 ? void 0 : searchResults.pages.flatMap(function (p) { return p.actors; })
            : suggestions === null || suggestions === void 0 ? void 0 : suggestions.actors;
        var _items = [];
        if (isFetchingSuggestions || isFetchingSearchResults) {
            var placeholders = Array(10)
                .fill(0)
                .map(function (__, i) { return ({
                type: 'placeholder',
                key: i + '',
            }); });
            _items.push.apply(_items, placeholders);
        }
        else if ((hasSearchText && searchResultsError) ||
            (!hasSearchText && suggestionsError) ||
            !(results === null || results === void 0 ? void 0 : results.length)) {
            _items.push({
                type: 'empty',
                key: 'empty',
                message: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["We're having network issues, try again"], ["We're having network issues, try again"])))),
            });
        }
        else {
            var seen = new Set();
            for (var _i = 0, results_1 = results; _i < results_1.length; _i++) {
                var profile = results_1[_i];
                if (seen.has(profile.did))
                    continue;
                if (profile.did === (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did))
                    continue;
                if ((_a = profile.viewer) === null || _a === void 0 ? void 0 : _a.following)
                    continue;
                seen.add(profile.did);
                _items.push({
                    type: 'profile',
                    // Don't share identity across tabs or typing attempts
                    key: resultsKey + ':' + profile.did,
                    profile: profile,
                });
            }
        }
        return _items;
    }, [
        _,
        suggestions,
        suggestionsError,
        isFetchingSuggestions,
        searchResults,
        searchResultsError,
        isFetchingSearchResults,
        currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did,
        hasSearchText,
        resultsKey,
    ]);
    if (searchText &&
        !isFetchingSearchResults &&
        !items.length &&
        !isSearchResultsError) {
        items.push({ type: 'empty', key: 'empty', message: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["No results"], ["No results"])))) });
    }
    var renderItems = useCallback(function (_a) {
        var item = _a.item, index = _a.index;
        switch (item.type) {
            case 'profile': {
                return (_jsx(FollowProfileCard, { profile: item.profile, moderationOpts: moderationOpts, noBorder: index === 0 }));
            }
            case 'placeholder': {
                return _jsx(ProfileCardSkeleton, {}, item.key);
            }
            case 'empty': {
                return _jsx(Empty, { message: item.message }, item.key);
            }
            default:
                return null;
        }
    }, [moderationOpts]);
    // Track seen profiles
    var seenProfilesRef = useRef(new Set());
    var itemsRef = useRef(items);
    itemsRef.current = items;
    var selectedInterestRef = useRef(selectedInterest);
    selectedInterestRef.current = selectedInterest;
    var onViewableItemsChanged = useRef(function (_a) {
        var viewableItems = _a.viewableItems;
        var _loop_1 = function (viewableItem) {
            var item = viewableItem.item;
            if (item.type === 'profile') {
                if (!seenProfilesRef.current.has(item.profile.did)) {
                    seenProfilesRef.current.add(item.profile.did);
                    var position = itemsRef.current.findIndex(function (i) { return i.type === 'profile' && i.profile.did === item.profile.did; });
                    ax.metric('suggestedUser:seen', {
                        logContext: 'ProgressGuide',
                        recId: undefined,
                        position: position !== -1 ? position : 0,
                        suggestedDid: item.profile.did,
                        category: selectedInterestRef.current,
                    });
                }
            }
        };
        for (var _i = 0, viewableItems_1 = viewableItems; _i < viewableItems_1.length; _i++) {
            var viewableItem = viewableItems_1[_i];
            _loop_1(viewableItem);
        }
    }).current;
    var viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50,
    }).current;
    var onSelectTab = useCallback(function (interest) {
        var _a, _b;
        setSelectedInterest(interest);
        (_a = inputRef.current) === null || _a === void 0 ? void 0 : _a.clear();
        setSearchText('');
        (_b = listRef.current) === null || _b === void 0 ? void 0 : _b.scrollToOffset({
            offset: 0,
            animated: false,
        });
    }, [setSelectedInterest, setSearchText]);
    var listHeader = (_jsx(Header, { guide: guide, inputRef: inputRef, listRef: listRef, searchText: searchText, onSelectTab: onSelectTab, setHeaderHeight: setHeaderHeight, setSearchText: setSearchText, interests: interests, selectedInterest: selectedInterest, interestsDisplayNames: interestsDisplayNames }));
    return (_jsx(Dialog.InnerFlatList, { ref: listRef, data: items, renderItem: renderItems, ListHeaderComponent: listHeader, stickyHeaderIndices: [0], keyExtractor: function (item) { return item.key; }, style: [
            a.px_0,
            web([a.py_0, { height: '100vh', maxHeight: 600 }]),
            native({ height: '100%' }),
        ], webInnerContentContainerStyle: a.py_0, webInnerStyle: [a.py_0, { maxWidth: 500, minWidth: 200 }], keyboardDismissMode: "on-drag", scrollIndicatorInsets: { top: headerHeight }, initialNumToRender: 8, maxToRenderPerBatch: 8, onViewableItemsChanged: onViewableItemsChanged, viewabilityConfig: viewabilityConfig }));
}
var Header = function (_a) {
    var guide = _a.guide, inputRef = _a.inputRef, listRef = _a.listRef, searchText = _a.searchText, onSelectTab = _a.onSelectTab, setHeaderHeight = _a.setHeaderHeight, setSearchText = _a.setSearchText, interests = _a.interests, selectedInterest = _a.selectedInterest, interestsDisplayNames = _a.interestsDisplayNames;
    var t = useTheme();
    var control = Dialog.useDialogContext();
    return (_jsxs(View, { onLayout: function (evt) { return setHeaderHeight(evt.nativeEvent.layout.height); }, style: [
            a.relative,
            web(a.pt_lg),
            native(a.pt_4xl),
            a.pb_xs,
            a.border_b,
            t.atoms.border_contrast_low,
            t.atoms.bg,
        ], children: [_jsx(HeaderTop, { guide: guide }), _jsxs(View, { style: [web(a.pt_xs), a.pb_xs], children: [_jsx(SearchInput, { inputRef: inputRef, defaultValue: searchText, onChangeText: function (text) {
                            var _a;
                            setSearchText(text);
                            (_a = listRef.current) === null || _a === void 0 ? void 0 : _a.scrollToOffset({ offset: 0, animated: false });
                        }, onEscape: control.close }), _jsx(InterestTabs, { onSelectTab: onSelectTab, interests: interests, selectedInterest: selectedInterest, disabled: !!searchText, interestsDisplayNames: interestsDisplayNames, TabComponent: Tab })] })] }));
};
Header = memo(Header);
function HeaderTop(_a) {
    var guide = _a.guide;
    var _ = useLingui()._;
    var t = useTheme();
    var control = Dialog.useDialogContext();
    return (_jsxs(View, { style: [
            a.px_lg,
            a.relative,
            a.flex_row,
            a.justify_between,
            a.align_center,
        ], children: [_jsx(Text, { style: [
                    a.z_10,
                    a.text_lg,
                    a.font_bold,
                    a.leading_tight,
                    t.atoms.text_contrast_high,
                ], children: _jsx(Trans, { children: "Find people to follow" }) }), guide && (_jsx(View, { style: IS_WEB && { paddingRight: 36 }, children: _jsx(ProgressGuideTask, { current: guide.numFollows + 1, total: 10 + 1, title: "".concat(guide.numFollows, " / 10"), tabularNumsTitle: true }) })), IS_WEB ? (_jsx(Button, { label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Close"], ["Close"])))), size: "small", shape: "round", variant: IS_WEB ? 'ghost' : 'solid', color: "secondary", style: [
                    a.absolute,
                    a.z_20,
                    web({ right: 8 }),
                    native({ right: 0 }),
                    native({ height: 32, width: 32, borderRadius: 16 }),
                ], onPress: function () { return control.close(); }, children: _jsx(ButtonIcon, { icon: X, size: "md" }) })) : null] }));
}
var Tab = function (_a) {
    var onSelectTab = _a.onSelectTab, interest = _a.interest, active = _a.active, index = _a.index, interestsDisplayName = _a.interestsDisplayName, onLayout = _a.onLayout;
    var t = useTheme();
    var _ = useLingui()._;
    var label = active
        ? _(msg({
            message: "Search for \"".concat(interestsDisplayName, "\" (active)"),
            comment: 'Accessibility label for a tab that searches for accounts in a category (e.g. Art, Video Games, Sports, etc.) that are suggested for the user to follow. The tab is currently selected.',
        }))
        : _(msg({
            message: "Search for \"".concat(interestsDisplayName, "\""),
            comment: 'Accessibility label for a tab that searches for accounts in a category (e.g. Art, Video Games, Sports, etc.) that are suggested for the user to follow. The tab is not currently active and can be selected.',
        }));
    return (_jsx(View, { onLayout: function (e) {
            return onLayout(index, e.nativeEvent.layout.x, e.nativeEvent.layout.width);
        }, children: _jsx(Button, { label: label, onPress: function () { return onSelectTab(index); }, children: function (_a) {
                var hovered = _a.hovered, pressed = _a.pressed;
                return (_jsx(View, { style: [
                        a.rounded_full,
                        a.px_lg,
                        a.py_sm,
                        a.border,
                        active || hovered || pressed
                            ? [
                                t.atoms.bg_contrast_25,
                                { borderColor: t.atoms.bg_contrast_25.backgroundColor },
                            ]
                            : [t.atoms.bg, t.atoms.border_contrast_low],
                    ], children: _jsx(Text, { style: [
                            a.font_medium,
                            active || hovered || pressed
                                ? t.atoms.text
                                : t.atoms.text_contrast_medium,
                        ], children: interestsDisplayName }) }));
            } }) }, interest));
};
Tab = memo(Tab);
var FollowProfileCard = function (_a) {
    var profile = _a.profile, moderationOpts = _a.moderationOpts, noBorder = _a.noBorder;
    return (_jsx(FollowProfileCardInner, { profile: profile, moderationOpts: moderationOpts, noBorder: noBorder }));
};
FollowProfileCard = memo(FollowProfileCard);
function FollowProfileCardInner(_a) {
    var profile = _a.profile, moderationOpts = _a.moderationOpts, onFollow = _a.onFollow, noBorder = _a.noBorder;
    var control = Dialog.useDialogContext();
    var t = useTheme();
    return (_jsx(ProfileCard.Link, { profile: profile, style: [a.flex_1], onPress: function () { return control.close(); }, children: function (_a) {
            var hovered = _a.hovered, pressed = _a.pressed;
            return (_jsx(CardOuter, { style: [
                    a.flex_1,
                    noBorder && a.border_t_0,
                    (hovered || pressed) && t.atoms.bg_contrast_25,
                ], children: _jsxs(ProfileCard.Outer, { children: [_jsxs(ProfileCard.Header, { children: [_jsx(ProfileCard.Avatar, { disabledPreview: !IS_WEB, profile: profile, moderationOpts: moderationOpts }), _jsx(ProfileCard.NameAndHandle, { profile: profile, moderationOpts: moderationOpts }), _jsx(ProfileCard.FollowButton, { profile: profile, moderationOpts: moderationOpts, logContext: "PostOnboardingFindFollows", shape: "round", onPress: onFollow, colorInverted: true })] }), _jsx(ProfileCard.Description, { profile: profile, numberOfLines: 2 })] }) }));
        } }));
}
function CardOuter(_a) {
    var children = _a.children, style = _a.style;
    var t = useTheme();
    return (_jsx(View, { style: [
            a.w_full,
            a.py_md,
            a.px_lg,
            a.border_t,
            t.atoms.border_contrast_low,
            style,
        ], children: children }));
}
function SearchInput(_a) {
    var onChangeText = _a.onChangeText, onEscape = _a.onEscape, inputRef = _a.inputRef, defaultValue = _a.defaultValue;
    var t = useTheme();
    var _ = useLingui()._;
    var _b = useInteractionState(), hovered = _b.state, onMouseEnter = _b.onIn, onMouseLeave = _b.onOut;
    var _c = useInteractionState(), focused = _c.state, onFocus = _c.onIn, onBlur = _c.onOut;
    var interacted = hovered || focused;
    return (_jsxs(View, __assign({}, web({
        onMouseEnter: onMouseEnter,
        onMouseLeave: onMouseLeave,
    }), { style: [a.flex_row, a.align_center, a.gap_sm, a.px_lg, a.py_xs], children: [_jsx(SearchIcon, { size: "md", fill: interacted ? t.palette.primary_500 : t.palette.contrast_300 }), _jsx(TextInput, { ref: inputRef, placeholder: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Search by name or interest"], ["Search by name or interest"])))), defaultValue: defaultValue, onChangeText: onChangeText, onFocus: onFocus, onBlur: onBlur, style: [a.flex_1, a.py_md, a.text_md, t.atoms.text], placeholderTextColor: t.palette.contrast_500, keyboardAppearance: t.name === 'light' ? 'light' : 'dark', returnKeyType: "search", clearButtonMode: "while-editing", maxLength: 50, onKeyPress: function (_a) {
                    var nativeEvent = _a.nativeEvent;
                    if (nativeEvent.key === 'Escape') {
                        onEscape();
                    }
                }, autoCorrect: false, autoComplete: "off", autoCapitalize: "none", accessibilityLabel: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Search profiles"], ["Search profiles"])))), accessibilityHint: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Searches for profiles"], ["Searches for profiles"])))) })] })));
}
function ProfileCardSkeleton() {
    var t = useTheme();
    return (_jsxs(View, { style: [
            a.flex_1,
            a.py_md,
            a.px_lg,
            a.gap_md,
            a.align_center,
            a.flex_row,
        ], children: [_jsx(View, { style: [
                    a.rounded_full,
                    { width: 42, height: 42 },
                    t.atoms.bg_contrast_25,
                ] }), _jsxs(View, { style: [a.flex_1, a.gap_sm], children: [_jsx(View, { style: [
                            a.rounded_xs,
                            { width: 80, height: 14 },
                            t.atoms.bg_contrast_25,
                        ] }), _jsx(View, { style: [
                            a.rounded_xs,
                            { width: 120, height: 10 },
                            t.atoms.bg_contrast_25,
                        ] })] })] }));
}
function Empty(_a) {
    var message = _a.message;
    var t = useTheme();
    return (_jsxs(View, { style: [a.p_lg, a.py_xl, a.align_center, a.gap_md], children: [_jsx(Text, { style: [a.text_sm, a.italic, t.atoms.text_contrast_high], children: message }), _jsx(Text, { style: [a.text_xs, t.atoms.text_contrast_low], children: "(\u256F\u00B0\u25A1\u00B0)\u256F\uFE35 \u253B\u2501\u253B" })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7;
