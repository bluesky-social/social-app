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
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import * as Contacts from 'expo-contacts';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Plural, Trans } from '@lingui/react/macro';
import { useIsFocused } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { wait } from '#/lib/async/wait';
import { HITSLOP_10, urls } from '#/lib/constants';
import { isBlockedOrBlocking, isMuted } from '#/lib/moderation/blocked-and-muted';
import { cleanError, isNetworkError } from '#/lib/strings/errors';
import { logger } from '#/logger';
import { updateProfileShadow, useProfileShadow, } from '#/state/cache/profile-shadow';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { findContactsStatusQueryKey, optimisticRemoveMatch, useContactsMatchesQuery, useContactsSyncStatusQuery, } from '#/state/queries/find-contacts';
import { useAgent, useSession } from '#/state/session';
import { ErrorScreen } from '#/view/com/util/error/ErrorScreen';
import { List } from '#/view/com/util/List';
import { atoms as a, tokens, useGutters, useTheme } from '#/alf';
import { Admonition } from '#/components/Admonition';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { ContactsHeroImage } from '#/components/contacts/components/HeroImage';
import { ArrowRotateClockwise_Stroke2_Corner0_Rounded as ResyncIcon } from '#/components/icons/ArrowRotate';
import { TimesLarge_Stroke2_Corner0_Rounded as XIcon } from '#/components/icons/Times';
import { Trash_Stroke2_Corner0_Rounded as TrashIcon } from '#/components/icons/Trash';
import * as Layout from '#/components/Layout';
import { InlineLinkText, Link } from '#/components/Link';
import { Loader } from '#/components/Loader';
import * as ProfileCard from '#/components/ProfileCard';
import * as Toast from '#/components/Toast';
import { Text } from '#/components/Typography';
import { useAnalytics } from '#/analytics';
import { IS_NATIVE } from '#/env';
import { bulkWriteFollows } from '../Onboarding/util';
export function FindContactsSettingsScreen(_a) {
    var _ = useLingui()._;
    var ax = useAnalytics();
    var _b = useContactsSyncStatusQuery(), data = _b.data, error = _b.error, refetch = _b.refetch;
    var isFocused = useIsFocused();
    useEffect(function () {
        var _a;
        if (data && isFocused) {
            ax.metric('contacts:settings:presented', {
                hasPreviouslySynced: !!data.syncStatus,
                matchCount: (_a = data.syncStatus) === null || _a === void 0 ? void 0 : _a.matchesCount,
            });
        }
    }, [data, isFocused]);
    return (_jsxs(Layout.Screen, { children: [_jsxs(Layout.Header.Outer, { children: [_jsx(Layout.Header.BackButton, {}), _jsx(Layout.Header.Content, { children: _jsx(Layout.Header.TitleText, { children: _jsx(Trans, { children: "Find Friends" }) }) }), _jsx(Layout.Header.Slot, {})] }), IS_NATIVE ? (data ? (!data.syncStatus ? (_jsx(Intro, {})) : (_jsx(SyncStatus, { info: data.syncStatus, refetchStatus: refetch }))) : error ? (_jsx(ErrorScreen, { title: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Error getting the latest data."], ["Error getting the latest data."])))), message: cleanError(error), onPressTryAgain: refetch })) : (_jsx(View, { style: [a.flex_1, a.justify_center, a.align_center], children: _jsx(Loader, { size: "xl" }) }))) : (_jsx(ErrorScreen, { title: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Not available on this platform."], ["Not available on this platform."])))), message: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Please use the native app to import your contacts."], ["Please use the native app to import your contacts."])))) }))] }));
}
function Intro() {
    var _this = this;
    var gutter = useGutters(['base']);
    var t = useTheme();
    var _ = useLingui()._;
    var _a = useQuery({
        queryKey: ['contacts-available'],
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Contacts.isAvailableAsync()];
                case 1: return [2 /*return*/, _a.sent()];
            }
        }); }); },
    }), isAvailable = _a.data, isSuccess = _a.isSuccess;
    return (_jsxs(Layout.Content, { contentContainerStyle: [gutter, a.gap_lg], children: [_jsx(ContactsHeroImage, {}), _jsx(Text, { style: [a.text_md, a.leading_snug, t.atoms.text_contrast_medium], children: _jsxs(Trans, { children: ["Find your friends on Bluesky by verifying your phone number and matching with your contacts. We protect your information and you control what happens next.", ' ', _jsx(InlineLinkText, { to: urls.website.blog.findFriendsAnnouncement, label: _(msg({
                                message: "Learn more about importing contacts",
                                context: "english-only-resource",
                            })), style: [a.text_md, a.leading_snug], children: _jsx(Trans, { context: "english-only-resource", children: "Learn more" }) })] }) }), isAvailable ? (_jsx(Link, { to: { screen: 'FindContactsFlow' }, label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Import contacts"], ["Import contacts"])))), size: "large", color: "primary", style: [a.flex_1, a.justify_center], children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Import contacts" }) }) })) : (isSuccess && (_jsx(Admonition, { type: "error", children: _jsx(Trans, { children: "Contact sync is not available on this device, as the app is unable to access your contacts." }) })))] }));
}
function SyncStatus(_a) {
    var _this = this;
    var _b, _c;
    var info = _a.info, refetchStatus = _a.refetchStatus;
    var ax = useAnalytics();
    var agent = useAgent();
    var queryClient = useQueryClient();
    var _ = useLingui()._;
    var moderationOpts = useModerationOpts();
    var _d = useContactsMatchesQuery(), data = _d.data, isPending = _d.isPending, hasNextPage = _d.hasNextPage, fetchNextPage = _d.fetchNextPage, isFetchingNextPage = _d.isFetchingNextPage, refetchMatches = _d.refetch;
    var _e = useState(false), isPTR = _e[0], setIsPTR = _e[1];
    var onRefresh = function () {
        setIsPTR(true);
        Promise.all([refetchStatus(), refetchMatches()]).finally(function () {
            setIsPTR(false);
        });
    };
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
        onMutate: function (did) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                ax.metric('contacts:settings:dismiss', {});
                optimisticRemoveMatch(queryClient, did);
                return [2 /*return*/];
            });
        }); },
        onError: function (err) {
            refetchMatches();
            if (isNetworkError(err)) {
                Toast.show(_(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Could not follow all matches - please check your network connection."], ["Could not follow all matches - please check your network connection."])))), { type: 'error' });
            }
            else {
                logger.error('Failed to follow all matches', { safeMessage: err });
                Toast.show(_(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Could not follow all matches. ", ""], ["Could not follow all matches. ", ""])), cleanError(err))), {
                    type: 'error',
                });
            }
        },
    }).mutate;
    var profiles = (_c = (_b = data === null || data === void 0 ? void 0 : data.pages) === null || _b === void 0 ? void 0 : _b.flatMap(function (page) { return page.matches; })) !== null && _c !== void 0 ? _c : [];
    var numProfiles = profiles.length;
    var isAnyUnfollowed = profiles.some(function (profile) { var _a; return !((_a = profile.viewer) === null || _a === void 0 ? void 0 : _a.following); });
    var renderItem = useCallback(function (_a) {
        var item = _a.item, index = _a.index;
        if (!moderationOpts)
            return null;
        return (_jsx(MatchItem, { profile: item, isFirst: index === 0, isLast: index === numProfiles - 1, moderationOpts: moderationOpts, dismissMatch: dismissMatch }));
    }, [numProfiles, moderationOpts, dismissMatch]);
    var onEndReached = function () {
        if (!hasNextPage || isFetchingNextPage)
            return;
        fetchNextPage();
    };
    return (_jsx(List, { data: profiles, renderItem: renderItem, ListHeaderComponent: _jsx(StatusHeader, { numMatches: info.matchesCount, isPending: isPending, isAnyUnfollowed: isAnyUnfollowed }), ListFooterComponent: _jsx(StatusFooter, { syncedAt: info.syncedAt }), onRefresh: onRefresh, refreshing: isPTR, onEndReached: onEndReached }));
}
function MatchItem(_a) {
    var _b;
    var profile = _a.profile, isFirst = _a.isFirst, isLast = _a.isLast, moderationOpts = _a.moderationOpts, dismissMatch = _a.dismissMatch;
    var t = useTheme();
    var _ = useLingui()._;
    var ax = useAnalytics();
    var shadow = useProfileShadow(profile);
    return (_jsx(View, { style: [a.px_xl], children: _jsx(View, { style: [
                a.p_md,
                a.border_t,
                a.border_x,
                t.atoms.border_contrast_high,
                isFirst && [
                    a.curve_continuous,
                    { borderTopLeftRadius: tokens.borderRadius.lg },
                    { borderTopRightRadius: tokens.borderRadius.lg },
                ],
                isLast && [
                    a.border_b,
                    a.curve_continuous,
                    { borderBottomLeftRadius: tokens.borderRadius.lg },
                    { borderBottomRightRadius: tokens.borderRadius.lg },
                    a.mb_sm,
                ],
            ], children: _jsxs(ProfileCard.Header, { children: [_jsx(ProfileCard.Avatar, { profile: profile, moderationOpts: moderationOpts }), _jsx(ProfileCard.NameAndHandle, { profile: profile, moderationOpts: moderationOpts }), _jsx(ProfileCard.FollowButton, { profile: profile, moderationOpts: moderationOpts, logContext: "FindContacts", onFollow: function () { return ax.metric('contacts:settings:follow', {}); } }), !((_b = shadow.viewer) === null || _b === void 0 ? void 0 : _b.following) && (_jsx(Button, { color: "secondary", variant: "ghost", label: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Remove suggestion"], ["Remove suggestion"])))), onPress: function () { return dismissMatch(profile.did); }, hoverStyle: [a.bg_transparent, { opacity: 0.5 }], hitSlop: 8, children: _jsx(ButtonIcon, { icon: XIcon }) }))] }) }) }));
}
function StatusHeader(_a) {
    var _this = this;
    var numMatches = _a.numMatches, isPending = _a.isPending, isAnyUnfollowed = _a.isAnyUnfollowed;
    var _ = useLingui()._;
    var ax = useAnalytics();
    var agent = useAgent();
    var queryClient = useQueryClient();
    var currentAccount = useSession().currentAccount;
    var _b = useMutation({
        mutationFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var didsToFollow, cursor, page, _i, _a, profile, uris, _b, didsToFollow_1, did, uri;
            var _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        didsToFollow = [];
                        _d.label = 1;
                    case 1: return [4 /*yield*/, agent.app.bsky.contact.getMatches({
                            limit: 100,
                            cursor: cursor,
                        })];
                    case 2:
                        page = _d.sent();
                        cursor = page.data.cursor;
                        for (_i = 0, _a = page.data.matches; _i < _a.length; _i++) {
                            profile = _a[_i];
                            if (profile.did !== (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did) &&
                                !isBlockedOrBlocking(profile) &&
                                !isMuted(profile) &&
                                !((_c = profile.viewer) === null || _c === void 0 ? void 0 : _c.following)) {
                                didsToFollow.push(profile.did);
                            }
                        }
                        _d.label = 3;
                    case 3:
                        if (cursor) return [3 /*break*/, 1];
                        _d.label = 4;
                    case 4:
                        ax.metric('contacts:settings:followAll', {
                            followCount: didsToFollow.length,
                        });
                        return [4 /*yield*/, wait(500, bulkWriteFollows(agent, didsToFollow))];
                    case 5:
                        uris = _d.sent();
                        for (_b = 0, didsToFollow_1 = didsToFollow; _b < didsToFollow_1.length; _b++) {
                            did = didsToFollow_1[_b];
                            uri = uris.get(did);
                            updateProfileShadow(queryClient, did, {
                                followingUri: uri,
                            });
                        }
                        return [2 /*return*/];
                }
            });
        }); },
        onSuccess: function () {
            Toast.show(_(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Followed all matches"], ["Followed all matches"])))), { type: 'success' });
        },
        onError: function (err) {
            if (isNetworkError(err)) {
                Toast.show(_(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Could not follow all matches - please check your network connection."], ["Could not follow all matches - please check your network connection."])))), { type: 'error' });
            }
            else {
                logger.error('Failed to follow all matches', { safeMessage: err });
                Toast.show(_(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["Could not follow all matches. ", ""], ["Could not follow all matches. ", ""])), cleanError(err))), {
                    type: 'error',
                });
            }
        },
    }), onFollowAll = _b.mutate, isFollowingAll = _b.isPending, hasFollowedAll = _b.isSuccess;
    if (numMatches > 0) {
        if (isPending) {
            return (_jsx(View, { style: [a.w_full, a.py_3xl, a.align_center], children: _jsx(Loader, { size: "xl" }) }));
        }
        return (_jsxs(View, { style: [
                a.pt_xl,
                a.px_xl,
                a.pb_md,
                a.flex_row,
                a.justify_between,
                a.align_center,
            ], children: [_jsx(Text, { style: [a.text_md, a.font_semi_bold], children: _jsx(Plural, { value: numMatches, one: "# contact found", other: "# contacts found" }) }), isAnyUnfollowed && (_jsx(Button, { label: _(msg(templateObject_11 || (templateObject_11 = __makeTemplateObject(["Follow all"], ["Follow all"])))), color: "primary", size: "small", variant: "ghost", onPress: function () { return onFollowAll(); }, disabled: isFollowingAll || hasFollowedAll, hitSlop: HITSLOP_10, style: [a.px_0, a.py_0, a.rounded_0], hoverStyle: [a.bg_transparent, { opacity: 0.5 }], children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Follow all" }) }) }))] }));
    }
    return null;
}
function StatusFooter(_a) {
    var _this = this;
    var syncedAt = _a.syncedAt;
    var _b = useLingui(), _ = _b._, i18n = _b.i18n;
    var t = useTheme();
    var ax = useAnalytics();
    var agent = useAgent();
    var queryClient = useQueryClient();
    var _c = useMutation({
        mutationFn: function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, agent.app.bsky.contact.removeData({})];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); },
        onMutate: function () { return ax.metric('contacts:settings:removeData', {}); },
        onSuccess: function () {
            Toast.show(_(msg(templateObject_12 || (templateObject_12 = __makeTemplateObject(["Contacts removed"], ["Contacts removed"])))));
            queryClient.setQueryData(findContactsStatusQueryKey, { syncStatus: undefined });
        },
        onError: function (err) {
            if (isNetworkError(err)) {
                Toast.show(_(msg(templateObject_13 || (templateObject_13 = __makeTemplateObject(["Failed to remove data due to a network error, please check your internet connection."], ["Failed to remove data due to a network error, please check your internet connection."])))), { type: 'error' });
            }
            else {
                logger.error('Remove data failed', { safeMessage: err });
                Toast.show(_(msg(templateObject_14 || (templateObject_14 = __makeTemplateObject(["Failed to remove data. ", ""], ["Failed to remove data. ", ""])), cleanError(err))), {
                    type: 'error',
                });
            }
        },
    }), removeData = _c.mutate, isPending = _c.isPending;
    return (_jsxs(View, { style: [a.px_xl, a.py_xl, a.gap_4xl], children: [_jsxs(View, { style: [a.gap_xs, a.align_start], children: [_jsx(Text, { style: [a.text_md, a.font_semi_bold], children: _jsx(Trans, { children: "Contacts imported" }) }), _jsxs(View, { style: [a.gap_2xs], children: [_jsx(Text, { style: [a.text_sm, a.leading_snug, t.atoms.text_contrast_medium], children: _jsx(Trans, { children: "We will notify you when we find your friends." }) }), _jsx(Text, { style: [a.text_sm, a.leading_snug, t.atoms.text_contrast_medium], children: _jsxs(Trans, { children: ["Imported on", ' ', i18n.date(new Date(syncedAt), {
                                            dateStyle: 'long',
                                        })] }) })] }), _jsxs(Link, { label: _(msg(templateObject_15 || (templateObject_15 = __makeTemplateObject(["Resync contacts"], ["Resync contacts"])))), to: { screen: 'FindContactsFlow' }, onPress: function () {
                            var daysSinceLastSync = Math.floor((Date.now() - new Date(syncedAt).getTime()) /
                                (1000 * 60 * 60 * 24));
                            ax.metric('contacts:settings:resync', {
                                daysSinceLastSync: daysSinceLastSync,
                            });
                        }, size: "small", color: "primary_subtle", style: [a.mt_xs], children: [_jsx(ButtonIcon, { icon: ResyncIcon }), _jsx(ButtonText, { children: _jsx(Trans, { children: "Resync contacts" }) })] })] }), _jsxs(View, { style: [a.gap_xs, a.align_start], children: [_jsx(Text, { style: [a.text_md, a.font_semi_bold], children: _jsx(Trans, { children: "Delete contacts" }) }), _jsx(Text, { style: [a.text_sm, a.leading_snug, t.atoms.text_contrast_medium], children: _jsx(Trans, { children: "Bluesky stores your contacts as encoded data. Removing your contacts will immediately delete this data." }) }), _jsxs(Button, { label: _(msg(templateObject_16 || (templateObject_16 = __makeTemplateObject(["Remove all contacts"], ["Remove all contacts"])))), onPress: function () { return removeData(); }, size: "small", color: "negative_subtle", disabled: isPending, style: [a.mt_xs], children: [_jsx(ButtonIcon, { icon: isPending ? Loader : TrashIcon }), _jsx(ButtonText, { children: _jsx(Trans, { children: "Remove all contacts" }) })] })] })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15, templateObject_16;
