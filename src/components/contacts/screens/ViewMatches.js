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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SMS from 'expo-sms';
import { msg, Plural, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { wait } from '#/lib/async/wait';
import { cleanError, isNetworkError } from '#/lib/strings/errors';
import { logger } from '#/logger';
import { updateProfileShadow, useProfileShadow, } from '#/state/cache/profile-shadow';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { optimisticRemoveMatch, useMatchesPassthroughQuery, } from '#/state/queries/find-contacts';
import { useAgent, useSession } from '#/state/session';
import { List } from '#/view/com/util/List';
import { UserAvatar } from '#/view/com/util/UserAvatar';
import { OnboardingPosition } from '#/screens/Onboarding/Layout';
import { bulkWriteFollows } from '#/screens/Onboarding/util';
import { atoms as a, tokens, useGutters, useTheme } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { SearchInput } from '#/components/forms/SearchInput';
import { useInteractionState } from '#/components/hooks/useInteractionState';
import { Check_Stroke2_Corner0_Rounded as CheckIcon } from '#/components/icons/Check';
import { MagnifyingGlassX_Stroke2_Corner0_Rounded_Large as SearchFailedIcon } from '#/components/icons/MagnifyingGlass';
import { PersonX_Stroke2_Corner0_Rounded_Large as PersonXIcon } from '#/components/icons/Person';
import { PlusLarge_Stroke2_Corner0_Rounded as PlusIcon } from '#/components/icons/Plus';
import { TimesLarge_Stroke2_Corner0_Rounded as XIcon } from '#/components/icons/Times';
import * as Layout from '#/components/Layout';
import { ListFooter } from '#/components/Lists';
import { Loader } from '#/components/Loader';
import * as ProfileCard from '#/components/ProfileCard';
import * as Toast from '#/components/Toast';
import { Text } from '#/components/Typography';
import { useAnalytics } from '#/analytics';
import { InviteInfo } from '../components/InviteInfo';
export function ViewMatches(_a) {
    var _this = this;
    var _b, _c;
    var state = _a.state, dispatch = _a.dispatch, context = _a.context, onNext = _a.onNext;
    var t = useTheme();
    var _ = useLingui()._;
    var ax = useAnalytics();
    var gutter = useGutters([0, 'wide']);
    var moderationOpts = useModerationOpts();
    var queryClient = useQueryClient();
    var agent = useAgent();
    var insets = useSafeAreaInsets();
    var listRef = useRef(null);
    var _d = useState(''), search = _d[0], setSearch = _d[1];
    var _e = useInteractionState(), searchFocused = _e.state, onFocus = _e.onIn, onBlur = _e.onOut;
    // HACK: Although we already have the match data, we need to pass it through
    // a query to get it into the shadow state
    var allMatches = useMatchesPassthroughQuery(state.matches);
    var matches = allMatches.filter(function (match) { return !state.dismissedMatches.includes(match.profile.did); });
    var followableDids = matches.map(function (match) { return match.profile.did; });
    var _f = useState(followableDids.length === 0), didFollowAll = _f[0], setDidFollowAll = _f[1];
    var cumulativeFollowCount = useRef(0);
    var onFollow = useCallback(function () {
        ax.metric('contacts:matches:follow', { entryPoint: context });
        cumulativeFollowCount.current += 1;
    }, [ax, context]);
    var _g = useMutation({
        mutationFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var _i, followableDids_1, did, uris, _a, followableDids_2, did, uri;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        for (_i = 0, followableDids_1 = followableDids; _i < followableDids_1.length; _i++) {
                            did = followableDids_1[_i];
                            updateProfileShadow(queryClient, did, {
                                followingUri: 'pending',
                            });
                        }
                        return [4 /*yield*/, wait(500, bulkWriteFollows(agent, followableDids))];
                    case 1:
                        uris = _b.sent();
                        for (_a = 0, followableDids_2 = followableDids; _a < followableDids_2.length; _a++) {
                            did = followableDids_2[_a];
                            uri = uris.get(did);
                            updateProfileShadow(queryClient, did, {
                                followingUri: uri,
                            });
                        }
                        return [2 /*return*/, followableDids];
                }
            });
        }); },
        onMutate: function () {
            return ax.metric('contacts:matches:followAll', {
                followCount: followableDids.length,
                entryPoint: context,
            });
        },
        onSuccess: function () {
            setDidFollowAll(true);
            Toast.show(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["All friends followed!"], ["All friends followed!"])))), { type: 'success' });
            cumulativeFollowCount.current += followableDids.length;
        },
        onError: function (_err) {
            Toast.show(_(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Failed to follow all your friends, please try again"], ["Failed to follow all your friends, please try again"])))), {
                type: 'error',
            });
            for (var _i = 0, followableDids_3 = followableDids; _i < followableDids_3.length; _i++) {
                var did = followableDids_3[_i];
                updateProfileShadow(queryClient, did, {
                    followingUri: undefined,
                });
            }
        },
    }), followAll = _g.mutate, isFollowingAll = _g.isPending;
    var items = useMemo(function () {
        var _a;
        var all = [];
        if (searchFocused || search.length > 0) {
            for (var _i = 0, matches_1 = matches; _i < matches_1.length; _i++) {
                var match = matches_1[_i];
                if (search.length === 0 ||
                    ((_a = match.profile.displayName) !== null && _a !== void 0 ? _a : '')
                        .toLocaleLowerCase()
                        .includes(search.toLocaleLowerCase()) ||
                    match.profile.handle
                        .toLocaleLowerCase()
                        .includes(search.toLocaleLowerCase())) {
                    all.push({ type: 'match', match: match });
                }
            }
            for (var _b = 0, _c = state.contacts; _b < _c.length; _b++) {
                var contact = _c[_b];
                if (search.length === 0 ||
                    [contact.firstName, contact.lastName]
                        .filter(Boolean)
                        .join(' ')
                        .toLocaleLowerCase()
                        .includes(search.toLocaleLowerCase())) {
                    all.push({ type: 'contact', contact: contact });
                }
            }
            if (all.length === 0) {
                all.push({ type: 'search empty state', query: search });
            }
        }
        else {
            if (matches.length > 0) {
                all.push({ type: 'matches header', count: matches.length });
                for (var _d = 0, matches_2 = matches; _d < matches_2.length; _d++) {
                    var match = matches_2[_d];
                    all.push({ type: 'match', match: match });
                }
                if (state.contacts.length > 0) {
                    all.push({ type: 'contacts header' });
                }
            }
            else if (state.contacts.length > 0) {
                all.push({ type: 'no matches header' });
            }
            for (var _e = 0, _f = state.contacts; _e < _f.length; _e++) {
                var contact = _f[_e];
                all.push({ type: 'contact', contact: contact });
            }
            if (all.length === 0) {
                all.push({ type: 'totally empty state' });
            }
        }
        return all;
    }, [matches, state.contacts, search, searchFocused]);
    var dismissMatch = useMutation({
        mutationFn: function (did) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, agent.app.bsky.contact.dismissMatch({ subject: did })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); },
        onMutate: function (did) {
            ax.metric('contacts:matches:dismiss', { entryPoint: context });
            dispatch({ type: 'DISMISS_MATCH', payload: { did: did } });
        },
        onSuccess: function (_res, did) {
            // for the other screen
            optimisticRemoveMatch(queryClient, did);
        },
        onError: function (err, did) {
            dispatch({ type: 'DISMISS_MATCH_FAILED', payload: { did: did } });
            if (isNetworkError(err)) {
                Toast.show(_(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Failed to hide suggestion, please check your internet connection"], ["Failed to hide suggestion, please check your internet connection"])))), { type: 'error' });
            }
            else {
                logger.error('Dismissing match failed', { safeMessage: err });
                Toast.show(_(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["An error occurred while hiding suggestion. ", ""], ["An error occurred while hiding suggestion. ", ""])), cleanError(err))), { type: 'error' });
            }
        },
    }).mutate;
    var renderItem = function (_a) {
        var item = _a.item;
        switch (item.type) {
            case 'match':
                return (_jsx(MatchItem, { profile: item.match.profile, contact: item.match.contact, moderationOpts: moderationOpts, onRemoveSuggestion: dismissMatch, onFollow: onFollow }));
            case 'contact':
                return _jsx(ContactItem, { contact: item.contact, context: context });
            case 'matches header':
                return (_jsx(Header, { titleText: _jsx(Plural, { value: item.count, one: "# friend found!", other: "# friends found!" }), children: item.count > 1 && (_jsxs(Button, { label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Follow all"], ["Follow all"])))), size: "small", color: "primary_subtle", onPress: function () { return followAll(); }, disabled: isFollowingAll || didFollowAll, children: [_jsx(ButtonIcon, { icon: isFollowingAll
                                    ? Loader
                                    : !didFollowAll
                                        ? PlusIcon
                                        : CheckIcon }), _jsx(ButtonText, { children: _jsx(Trans, { children: "Follow all" }) })] })) }));
            case 'contacts header':
                return (_jsx(Header, { titleText: _jsxs(Trans, { children: ["Invite friends", ' ', _jsx(InviteInfo, { iconStyle: t.atoms.text, iconOffset: 1 })] }), hasContentAbove: true }));
            case 'no matches header':
                return (_jsx(Header, { titleText: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["You got here first"], ["You got here first"])))), largeTitle: true, subtitleText: _jsxs(Trans, { children: ["Bluesky is more fun with friends. Do you want to invite some of yours?", ' ', _jsx(InviteInfo, { iconStyle: t.atoms.text_contrast_medium, iconOffset: 2 })] }) }));
            case 'search empty state':
                return _jsx(SearchEmptyState, { query: item.query });
            case 'totally empty state':
                return _jsx(TotallyEmptyState, {});
        }
    };
    var isSearchEmpty = ((_b = items === null || items === void 0 ? void 0 : items[0]) === null || _b === void 0 ? void 0 : _b.type) === 'search empty state';
    var isTotallyEmpty = ((_c = items === null || items === void 0 ? void 0 : items[0]) === null || _c === void 0 ? void 0 : _c.type) === 'totally empty state';
    var isEmpty = isSearchEmpty || isTotallyEmpty;
    return (_jsxs(View, { style: [a.h_full], children: [context === 'Standalone' && (_jsxs(Layout.Header.Outer, { noBottomBorder: true, children: [_jsx(Layout.Header.BackButton, {}), _jsx(Layout.Header.Content, {}), _jsx(Layout.Header.Slot, {})] })), !isTotallyEmpty && (_jsxs(View, { style: [
                    gutter,
                    a.mb_md,
                    context === 'Onboarding' && [a.mt_sm, a.gap_sm],
                ], children: [context === 'Onboarding' && _jsx(OnboardingPosition, {}), _jsx(SearchInput, { placeholder: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Search contacts"], ["Search contacts"])))), value: search, onFocus: function () {
                            var _a;
                            onFocus();
                            (_a = listRef.current) === null || _a === void 0 ? void 0 : _a.scrollToOffset({ offset: 0, animated: false });
                        }, onBlur: function () {
                            var _a;
                            onBlur();
                            (_a = listRef.current) === null || _a === void 0 ? void 0 : _a.scrollToOffset({ offset: 0, animated: false });
                        }, onChangeText: function (text) {
                            var _a;
                            setSearch(text);
                            (_a = listRef.current) === null || _a === void 0 ? void 0 : _a.scrollToOffset({ offset: 0, animated: false });
                        }, onClearText: function () { return setSearch(''); } })] })), _jsx(List, { ref: listRef, data: items, renderItem: renderItem, ListFooterComponent: !isEmpty ? _jsx(ListFooter, { height: 20 }) : null, keyExtractor: keyExtractor, keyboardDismissMode: "interactive", automaticallyAdjustKeyboardInsets: true }), _jsx(View, { style: [
                    t.atoms.bg,
                    t.atoms.border_contrast_low,
                    a.border_t,
                    a.align_center,
                    a.align_stretch,
                    gutter,
                    a.pt_md,
                    { paddingBottom: insets.bottom + tokens.space.md },
                ], children: _jsx(Button, { label: context === 'Onboarding' ? _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Next"], ["Next"])))) : _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Done"], ["Done"])))), onPress: function () {
                        if (context === 'Onboarding') {
                            ax.metric('onboarding:contacts:nextPressed', {
                                matchCount: allMatches.length,
                                followCount: cumulativeFollowCount.current,
                                dismissedMatchCount: state.dismissedMatches.length,
                            });
                        }
                        onNext();
                    }, size: "large", color: "primary", children: _jsx(ButtonText, { children: context === 'Onboarding' ? (_jsx(Trans, { children: "Next" })) : (_jsx(Trans, { children: "Done" })) }) }) })] }));
}
function keyExtractor(item) {
    switch (item.type) {
        case 'contact':
            return item.contact.id;
        case 'match':
            return item.match.profile.did;
        default:
            return item.type;
    }
}
function MatchItem(_a) {
    var _b;
    var profile = _a.profile, contact = _a.contact, moderationOpts = _a.moderationOpts, onRemoveSuggestion = _a.onRemoveSuggestion, onFollow = _a.onFollow;
    var gutter = useGutters([0, 'wide']);
    var t = useTheme();
    var _ = useLingui()._;
    var shadow = useProfileShadow(profile);
    var contactName = useMemo(function () {
        var _a, _b, _c, _d, _e;
        if (!contact)
            return null;
        var name = (_b = (_a = contact.name) !== null && _a !== void 0 ? _a : contact.firstName) !== null && _b !== void 0 ? _b : contact.lastName;
        if (name)
            return _(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["Your contact ", ""], ["Your contact ", ""])), name));
        var phone = (_d = (_c = contact.phoneNumbers) === null || _c === void 0 ? void 0 : _c.find(function (p) { return p.isPrimary; })) !== null && _d !== void 0 ? _d : (_e = contact.phoneNumbers) === null || _e === void 0 ? void 0 : _e[0];
        if (phone === null || phone === void 0 ? void 0 : phone.number)
            return phone.number;
        return null;
    }, [contact, _]);
    if (!moderationOpts)
        return null;
    return (_jsx(View, { style: [gutter, a.py_md, a.border_t, t.atoms.border_contrast_low], children: _jsxs(ProfileCard.Header, { children: [_jsx(ProfileCard.Avatar, { profile: profile, moderationOpts: moderationOpts, size: 48 }), _jsxs(View, { style: [a.flex_1], children: [_jsx(ProfileCard.Name, { profile: profile, moderationOpts: moderationOpts, textStyle: [a.leading_tight] }), _jsx(ProfileCard.Handle, { profile: profile, textStyle: [contactName && a.text_xs] }), contactName && (_jsx(Text, { emoji: true, style: [a.leading_snug, t.atoms.text_contrast_medium, a.text_xs], numberOfLines: 1, children: contactName }))] }), _jsx(ProfileCard.FollowButton, { profile: profile, moderationOpts: moderationOpts, logContext: "FindContacts", onFollow: onFollow }), !((_b = shadow.viewer) === null || _b === void 0 ? void 0 : _b.following) && (_jsx(Button, { color: "secondary", variant: "ghost", label: _(msg(templateObject_11 || (templateObject_11 = __makeTemplateObject(["Remove suggestion"], ["Remove suggestion"])))), onPress: function () { return onRemoveSuggestion(profile.did); }, hoverStyle: [a.bg_transparent, { opacity: 0.5 }], hitSlop: 8, children: _jsx(ButtonIcon, { icon: XIcon }) }))] }) }));
}
function ContactItem(_a) {
    var _this = this;
    var _b, _c, _d, _e, _f, _g;
    var contact = _a.contact, context = _a.context;
    var gutter = useGutters([0, 'wide']);
    var t = useTheme();
    var _ = useLingui()._;
    var ax = useAnalytics();
    var currentAccount = useSession().currentAccount;
    var name = (_c = (_b = contact.name) !== null && _b !== void 0 ? _b : contact.firstName) !== null && _c !== void 0 ? _c : contact.lastName;
    var phone = (_e = (_d = contact.phoneNumbers) === null || _d === void 0 ? void 0 : _d.find(function (phone) { return phone.isPrimary; })) !== null && _e !== void 0 ? _e : (_f = contact.phoneNumbers) === null || _f === void 0 ? void 0 : _f[0];
    var phoneNumber = phone === null || phone === void 0 ? void 0 : phone.number;
    return (_jsx(View, { style: [gutter, a.py_md, a.border_t, t.atoms.border_contrast_low], children: _jsxs(ProfileCard.Header, { children: [contact.image ? (_jsx(UserAvatar, { size: 40, avatar: contact.image.uri, type: "user" })) : (_jsx(View, { style: [
                        { width: 40, height: 40 },
                        a.rounded_full,
                        a.justify_center,
                        a.align_center,
                        t.atoms.bg_contrast_400,
                    ], children: _jsx(Text, { style: [
                            a.text_lg,
                            a.font_semi_bold,
                            { color: t.palette.contrast_0 },
                        ], children: (_g = name === null || name === void 0 ? void 0 : name[0]) === null || _g === void 0 ? void 0 : _g.toLocaleUpperCase() }) })), _jsx(Text, { style: [
                        a.flex_1,
                        a.text_md,
                        a.font_medium,
                        !name && [t.atoms.text_contrast_medium, a.italic],
                    ], numberOfLines: 2, children: name !== null && name !== void 0 ? name : _jsx(Trans, { children: "No name" }) }), phoneNumber && currentAccount && (_jsx(Button, { label: _(msg(templateObject_12 || (templateObject_12 = __makeTemplateObject(["Invite ", " to join Bluesky"], ["Invite ", " to join Bluesky"])), name)), color: "secondary", size: "small", onPress: function () { return __awaiter(_this, void 0, void 0, function () {
                        var err_1;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    ax.metric('contacts:matches:invite', {
                                        entryPoint: context,
                                    });
                                    _a.label = 1;
                                case 1:
                                    _a.trys.push([1, 3, , 4]);
                                    return [4 /*yield*/, SMS.sendSMSAsync([phoneNumber], _(msg(templateObject_13 || (templateObject_13 = __makeTemplateObject(["I'm on Bluesky as ", " - come find me! https://bsky.app/download"], ["I'm on Bluesky as ", " - come find me! https://bsky.app/download"])), currentAccount.handle)))];
                                case 2:
                                    _a.sent();
                                    return [3 /*break*/, 4];
                                case 3:
                                    err_1 = _a.sent();
                                    Toast.show(_(msg(templateObject_14 || (templateObject_14 = __makeTemplateObject(["Failed to launch SMS app"], ["Failed to launch SMS app"])))), { type: 'error' });
                                    logger.error('Could not launch SMS', { safeMessage: err_1 });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); }, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Invite" }) }) }))] }) }));
}
function Header(_a) {
    var titleText = _a.titleText, largeTitle = _a.largeTitle, subtitleText = _a.subtitleText, children = _a.children, hasContentAbove = _a.hasContentAbove;
    var gutter = useGutters([0, 'wide']);
    var t = useTheme();
    return (_jsxs(View, { style: [
            gutter,
            a.pb_md,
            a.gap_sm,
            hasContentAbove
                ? [a.pt_4xl, a.border_t, t.atoms.border_contrast_low]
                : a.pt_md,
        ], children: [_jsxs(View, { style: [a.flex_row, a.align_center, a.justify_between], children: [_jsx(Text, { style: [largeTitle ? a.text_3xl : a.text_xl, a.font_bold], children: titleText }), children] }), subtitleText && (_jsx(Text, { style: [a.text_md, t.atoms.text_contrast_medium, a.leading_snug], children: subtitleText }))] }));
}
function SearchEmptyState(_a) {
    var query = _a.query;
    var t = useTheme();
    return (_jsxs(View, { style: [
            a.flex_1,
            a.flex_col,
            a.align_center,
            a.justify_center,
            a.gap_lg,
            a.pt_5xl,
            a.px_5xl,
        ], children: [_jsx(SearchFailedIcon, { width: 64, style: [t.atoms.text_contrast_low] }), _jsx(Text, { style: [
                    a.text_md,
                    a.leading_snug,
                    t.atoms.text_contrast_medium,
                    a.text_center,
                ], children: _jsxs(Trans, { children: ["No contacts with the name \u201C", query, "\u201D found"] }) })] }));
}
function TotallyEmptyState() {
    var t = useTheme();
    return (_jsxs(View, { style: [
            a.flex_1,
            a.flex_col,
            a.align_center,
            a.justify_center,
            a.gap_lg,
            { paddingTop: 140 },
            a.px_5xl,
        ], children: [_jsx(PersonXIcon, { width: 64, style: [t.atoms.text_contrast_low] }), _jsx(Text, { style: [a.text_xl, a.font_bold, a.leading_snug, a.text_center], children: _jsx(Trans, { children: "No contacts found" }) })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14;
