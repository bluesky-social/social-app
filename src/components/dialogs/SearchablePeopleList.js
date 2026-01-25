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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Fragment, useCallback, useLayoutEffect, useMemo, useRef, useState, } from 'react';
import { TextInput, View } from 'react-native';
import { moderateProfile } from '@atproto/api';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { sanitizeHandle } from '#/lib/strings/handles';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useActorAutocompleteQuery } from '#/state/queries/actor-autocomplete';
import { useListConvosQuery } from '#/state/queries/messages/list-conversations';
import { useProfileFollowsQuery } from '#/state/queries/profile-follows';
import { useSession } from '#/state/session';
import { android, atoms as a, native, useTheme, web } from '#/alf';
import { Button, ButtonIcon } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { canBeMessaged } from '#/components/dms/util';
import { useInteractionState } from '#/components/hooks/useInteractionState';
import { MagnifyingGlass_Stroke2_Corner0_Rounded as Search } from '#/components/icons/MagnifyingGlass';
import { TimesLarge_Stroke2_Corner0_Rounded as X } from '#/components/icons/Times';
import * as ProfileCard from '#/components/ProfileCard';
import { Text } from '#/components/Typography';
import { IS_WEB } from '#/env';
export function SearchablePeopleList(_a) {
    var title = _a.title, showRecentConvos = _a.showRecentConvos, sortByMessageDeclaration = _a.sortByMessageDeclaration, onSelectChat = _a.onSelectChat, renderProfileCard = _a.renderProfileCard;
    var t = useTheme();
    var _ = useLingui()._;
    var moderationOpts = useModerationOpts();
    var control = Dialog.useDialogContext();
    var _b = useState(0), headerHeight = _b[0], setHeaderHeight = _b[1];
    var listRef = useRef(null);
    var currentAccount = useSession().currentAccount;
    var inputRef = useRef(null);
    var _c = useState(''), searchText = _c[0], setSearchText = _c[1];
    var _d = useActorAutocompleteQuery(searchText, true, 12), results = _d.data, isError = _d.isError, isFetching = _d.isFetching;
    var follows = useProfileFollowsQuery(currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did).data;
    var convos = useListConvosQuery({
        enabled: showRecentConvos,
        status: 'accepted',
    }).data;
    var items = useMemo(function () {
        var _items = [];
        if (isError) {
            _items.push({
                type: 'empty',
                key: 'empty',
                message: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["We're having network issues, try again"], ["We're having network issues, try again"])))),
            });
        }
        else if (searchText.length) {
            if (results === null || results === void 0 ? void 0 : results.length) {
                for (var _i = 0, results_1 = results; _i < results_1.length; _i++) {
                    var profile = results_1[_i];
                    if (profile.did === (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did))
                        continue;
                    _items.push({
                        type: 'profile',
                        key: profile.did,
                        profile: profile,
                    });
                }
                if (sortByMessageDeclaration) {
                    _items = _items.sort(function (item) {
                        return item.type === 'profile' && canBeMessaged(item.profile)
                            ? -1
                            : 1;
                    });
                }
            }
        }
        else {
            var placeholders = Array(10)
                .fill(0)
                .map(function (__, i) { return ({
                type: 'placeholder',
                key: i + '',
            }); });
            if (showRecentConvos) {
                if (convos && follows) {
                    var usedDids = new Set();
                    for (var _a = 0, _b = convos.pages; _a < _b.length; _a++) {
                        var page = _b[_a];
                        for (var _c = 0, _d = page.convos; _c < _d.length; _c++) {
                            var convo = _d[_c];
                            var profiles = convo.members.filter(function (m) { return m.did !== (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did); });
                            for (var _e = 0, profiles_1 = profiles; _e < profiles_1.length; _e++) {
                                var profile = profiles_1[_e];
                                if (usedDids.has(profile.did))
                                    continue;
                                usedDids.add(profile.did);
                                _items.push({
                                    type: 'profile',
                                    key: profile.did,
                                    profile: profile,
                                });
                            }
                        }
                    }
                    var followsItems = [];
                    for (var _f = 0, _g = follows.pages; _f < _g.length; _f++) {
                        var page = _g[_f];
                        for (var _h = 0, _j = page.follows; _h < _j.length; _h++) {
                            var profile = _j[_h];
                            if (usedDids.has(profile.did))
                                continue;
                            followsItems.push({
                                type: 'profile',
                                key: profile.did,
                                profile: profile,
                            });
                        }
                    }
                    if (sortByMessageDeclaration) {
                        // only sort follows
                        followsItems = followsItems.sort(function (item) {
                            return canBeMessaged(item.profile) ? -1 : 1;
                        });
                    }
                    // then append
                    _items.push.apply(_items, followsItems);
                }
                else {
                    _items.push.apply(_items, placeholders);
                }
            }
            else if (follows) {
                for (var _k = 0, _l = follows.pages; _k < _l.length; _k++) {
                    var page = _l[_k];
                    for (var _m = 0, _o = page.follows; _m < _o.length; _m++) {
                        var profile = _o[_m];
                        _items.push({
                            type: 'profile',
                            key: profile.did,
                            profile: profile,
                        });
                    }
                }
                if (sortByMessageDeclaration) {
                    _items = _items.sort(function (item) {
                        return item.type === 'profile' && canBeMessaged(item.profile)
                            ? -1
                            : 1;
                    });
                }
            }
            else {
                _items.push.apply(_items, placeholders);
            }
        }
        return _items;
    }, [
        _,
        searchText,
        results,
        isError,
        currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did,
        follows,
        convos,
        showRecentConvos,
        sortByMessageDeclaration,
    ]);
    if (searchText && !isFetching && !items.length && !isError) {
        items.push({ type: 'empty', key: 'empty', message: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["No results"], ["No results"])))) });
    }
    var renderItems = useCallback(function (_a) {
        var item = _a.item;
        switch (item.type) {
            case 'profile': {
                if (renderProfileCard) {
                    return _jsx(Fragment, { children: renderProfileCard(item) }, item.key);
                }
                else {
                    return (_jsx(DefaultProfileCard, { profile: item.profile, moderationOpts: moderationOpts, onPress: onSelectChat }, item.key));
                }
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
    }, [moderationOpts, onSelectChat, renderProfileCard]);
    useLayoutEffect(function () {
        if (IS_WEB) {
            setImmediate(function () {
                var _a;
                (_a = inputRef === null || inputRef === void 0 ? void 0 : inputRef.current) === null || _a === void 0 ? void 0 : _a.focus();
            });
        }
    }, []);
    var listHeader = useMemo(function () {
        return (_jsxs(View, { onLayout: function (evt) { return setHeaderHeight(evt.nativeEvent.layout.height); }, style: [
                a.relative,
                web(a.pt_lg),
                native(a.pt_4xl),
                android({
                    borderTopLeftRadius: a.rounded_md.borderRadius,
                    borderTopRightRadius: a.rounded_md.borderRadius,
                }),
                a.pb_xs,
                a.px_lg,
                a.border_b,
                t.atoms.border_contrast_low,
                t.atoms.bg,
            ], children: [_jsxs(View, { style: [a.relative, native(a.align_center), a.justify_center], children: [_jsx(Text, { style: [
                                a.z_10,
                                a.text_lg,
                                a.font_bold,
                                a.leading_tight,
                                t.atoms.text_contrast_high,
                            ], children: title }), IS_WEB ? (_jsx(Button, { label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Close"], ["Close"])))), size: "small", shape: "round", variant: IS_WEB ? 'ghost' : 'solid', color: "secondary", style: [
                                a.absolute,
                                a.z_20,
                                web({ right: -4 }),
                                native({ right: 0 }),
                                native({ height: 32, width: 32, borderRadius: 16 }),
                            ], onPress: function () { return control.close(); }, children: _jsx(ButtonIcon, { icon: X, size: "md" }) })) : null] }), _jsx(View, { style: web([a.pt_xs]), children: _jsx(SearchInput, { inputRef: inputRef, value: searchText, onChangeText: function (text) {
                            var _a;
                            setSearchText(text);
                            (_a = listRef.current) === null || _a === void 0 ? void 0 : _a.scrollToOffset({ offset: 0, animated: false });
                        }, onEscape: control.close }) })] }));
    }, [
        t.atoms.border_contrast_low,
        t.atoms.bg,
        t.atoms.text_contrast_high,
        _,
        title,
        searchText,
        control,
    ]);
    return (_jsx(Dialog.InnerFlatList, { ref: listRef, data: items, renderItem: renderItems, ListHeaderComponent: listHeader, stickyHeaderIndices: [0], keyExtractor: function (item) { return item.key; }, style: [
            web([a.py_0, { height: '100vh', maxHeight: 600 }, a.px_0]),
            native({ height: '100%' }),
        ], webInnerContentContainerStyle: a.py_0, webInnerStyle: [a.py_0, { maxWidth: 500, minWidth: 200 }], scrollIndicatorInsets: { top: headerHeight }, keyboardDismissMode: "on-drag" }));
}
function DefaultProfileCard(_a) {
    var profile = _a.profile, moderationOpts = _a.moderationOpts, onPress = _a.onPress;
    var t = useTheme();
    var _ = useLingui()._;
    var enabled = canBeMessaged(profile);
    var moderation = moderateProfile(profile, moderationOpts);
    var handle = sanitizeHandle(profile.handle, '@');
    var displayName = sanitizeDisplayName(profile.displayName || sanitizeHandle(profile.handle), moderation.ui('displayName'));
    var handleOnPress = useCallback(function () {
        onPress(profile.did);
    }, [onPress, profile.did]);
    return (_jsx(Button, { disabled: !enabled, label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Start chat with ", ""], ["Start chat with ", ""])), displayName)), onPress: handleOnPress, children: function (_a) {
            var hovered = _a.hovered, pressed = _a.pressed, focused = _a.focused;
            return (_jsx(View, { style: [
                    a.flex_1,
                    a.py_sm,
                    a.px_lg,
                    !enabled
                        ? { opacity: 0.5 }
                        : pressed || focused || hovered
                            ? t.atoms.bg_contrast_25
                            : t.atoms.bg,
                ], children: _jsxs(ProfileCard.Header, { children: [_jsx(ProfileCard.Avatar, { profile: profile, moderationOpts: moderationOpts, disabledPreview: true }), _jsxs(View, { style: [a.flex_1], children: [_jsx(ProfileCard.Name, { profile: profile, moderationOpts: moderationOpts }), enabled ? (_jsx(ProfileCard.Handle, { profile: profile })) : (_jsx(Text, { style: [a.leading_snug, t.atoms.text_contrast_high], numberOfLines: 2, children: _jsxs(Trans, { children: [handle, " can't be messaged"] }) }))] })] }) }));
        } }));
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
function SearchInput(_a) {
    var value = _a.value, onChangeText = _a.onChangeText, onEscape = _a.onEscape, inputRef = _a.inputRef;
    var t = useTheme();
    var _ = useLingui()._;
    var _b = useInteractionState(), hovered = _b.state, onMouseEnter = _b.onIn, onMouseLeave = _b.onOut;
    var _c = useInteractionState(), focused = _c.state, onFocus = _c.onIn, onBlur = _c.onOut;
    var interacted = hovered || focused;
    return (_jsxs(View, __assign({}, web({
        onMouseEnter: onMouseEnter,
        onMouseLeave: onMouseLeave,
    }), { style: [a.flex_row, a.align_center, a.gap_sm], children: [_jsx(Search, { size: "md", fill: interacted ? t.palette.primary_500 : t.palette.contrast_300 }), _jsx(TextInput
            // @ts-ignore bottom sheet input types issue — esb
            , { 
                // @ts-ignore bottom sheet input types issue — esb
                ref: inputRef, placeholder: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Search"], ["Search"])))), value: value, onChangeText: onChangeText, onFocus: onFocus, onBlur: onBlur, style: [a.flex_1, a.py_md, a.text_md, t.atoms.text], placeholderTextColor: t.palette.contrast_500, keyboardAppearance: t.name === 'light' ? 'light' : 'dark', returnKeyType: "search", clearButtonMode: "while-editing", maxLength: 50, onKeyPress: function (_a) {
                    var nativeEvent = _a.nativeEvent;
                    if (nativeEvent.key === 'Escape') {
                        onEscape();
                    }
                }, autoCorrect: false, autoComplete: "off", autoCapitalize: "none", autoFocus: true, accessibilityLabel: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Search profiles"], ["Search profiles"])))), accessibilityHint: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Searches for profiles"], ["Searches for profiles"])))) })] })));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7;
