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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { msg, plural, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { useActorStatus } from '#/lib/actor-status';
import { useAccountSwitcher } from '#/lib/hooks/useAccountSwitcher';
import { useOpenComposer } from '#/lib/hooks/useOpenComposer';
import { usePalette } from '#/lib/hooks/usePalette';
import { useWebMediaQueries } from '#/lib/hooks/useWebMediaQueries';
import { getCurrentRoute, isTab } from '#/lib/routes/helpers';
import { makeProfileLink } from '#/lib/routes/links';
import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { isInvalidHandle, sanitizeHandle } from '#/lib/strings/handles';
import { emitSoftReset } from '#/state/events';
import { useFetchHandle } from '#/state/queries/handle';
import { useUnreadMessageCount } from '#/state/queries/messages/list-conversations';
import { useUnreadNotifications } from '#/state/queries/notifications/unread';
import { useProfilesQuery } from '#/state/queries/profile';
import { useSession, useSessionApi } from '#/state/session';
import { useLoggedOutViewControls } from '#/state/shell/logged-out';
import { useCloseAllActiveElements } from '#/state/util';
import { LoadingPlaceholder } from '#/view/com/util/LoadingPlaceholder';
import { PressableWithHover } from '#/view/com/util/PressableWithHover';
import { UserAvatar } from '#/view/com/util/UserAvatar';
import { NavSignupCard } from '#/view/shell/NavSignupCard';
import { atoms as a, tokens, useLayoutBreakpoints, useTheme, web } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { ArrowBoxLeft_Stroke2_Corner0_Rounded as LeaveIcon } from '#/components/icons/ArrowBoxLeft';
import { Bell_Filled_Corner0_Rounded as BellFilled, Bell_Stroke2_Corner0_Rounded as Bell, } from '#/components/icons/Bell';
import { Bookmark, BookmarkFilled } from '#/components/icons/Bookmark';
import { BulletList_Filled_Corner0_Rounded as ListFilled, BulletList_Stroke2_Corner0_Rounded as List, } from '#/components/icons/BulletList';
import { DotGrid_Stroke2_Corner0_Rounded as EllipsisIcon } from '#/components/icons/DotGrid';
import { EditBig_Stroke2_Corner0_Rounded as EditBig } from '#/components/icons/EditBig';
import { Hashtag_Filled_Corner0_Rounded as HashtagFilled, Hashtag_Stroke2_Corner0_Rounded as Hashtag, } from '#/components/icons/Hashtag';
import { HomeOpen_Filled_Corner0_Rounded as HomeFilled, HomeOpen_Stoke2_Corner0_Rounded as Home, } from '#/components/icons/HomeOpen';
import { MagnifyingGlass_Filled_Stroke2_Corner0_Rounded as MagnifyingGlassFilled, MagnifyingGlass_Stroke2_Corner0_Rounded as MagnifyingGlass, } from '#/components/icons/MagnifyingGlass';
import { Message_Stroke2_Corner0_Rounded as Message, Message_Stroke2_Corner0_Rounded_Filled as MessageFilled, } from '#/components/icons/Message';
import { PlusLarge_Stroke2_Corner0_Rounded as PlusIcon } from '#/components/icons/Plus';
import { SettingsGear2_Filled_Corner0_Rounded as SettingsFilled, SettingsGear2_Stroke2_Corner0_Rounded as Settings, } from '#/components/icons/SettingsGear2';
import { UserCircle_Filled_Corner0_Rounded as UserCircleFilled, UserCircle_Stroke2_Corner0_Rounded as UserCircle, } from '#/components/icons/UserCircle';
import { CENTER_COLUMN_OFFSET } from '#/components/Layout';
import * as Menu from '#/components/Menu';
import * as Prompt from '#/components/Prompt';
import { Text } from '#/components/Typography';
import { PlatformInfo } from '../../../../modules/expo-bluesky-swiss-army';
import { router } from '../../../routes';
var NAV_ICON_WIDTH = 28;
function ProfileCard() {
    var _a = useSession(), currentAccount = _a.currentAccount, accounts = _a.accounts;
    var logoutEveryAccount = useSessionApi().logoutEveryAccount;
    var _b = useProfilesQuery({
        handles: accounts.map(function (acc) { return acc.did; }),
    }), isLoading = _b.isLoading, data = _b.data;
    var profiles = data === null || data === void 0 ? void 0 : data.profiles;
    var signOutPromptControl = Prompt.usePromptControl();
    var leftNavMinimal = useLayoutBreakpoints().leftNavMinimal;
    var _ = useLingui()._;
    var t = useTheme();
    var size = 48;
    var profile = profiles === null || profiles === void 0 ? void 0 : profiles.find(function (p) { return p.did === currentAccount.did; });
    var otherAccounts = accounts
        .filter(function (acc) { return acc.did !== currentAccount.did; })
        .map(function (account) { return ({
        account: account,
        profile: profiles === null || profiles === void 0 ? void 0 : profiles.find(function (p) { return p.did === account.did; }),
    }); });
    var live = useActorStatus(profile).isActive;
    return (_jsxs(View, { style: [a.my_md, !leftNavMinimal && [a.w_full, a.align_start]], children: [!isLoading && profile ? (_jsxs(Menu.Root, { children: [_jsx(Menu.Trigger, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Switch accounts"], ["Switch accounts"])))), children: function (_a) {
                            var _b;
                            var props = _a.props, state = _a.state, control = _a.control;
                            var active = state.hovered || state.focused || control.isOpen;
                            return (_jsxs(Button, __assign({ label: props.accessibilityLabel }, props, { style: [
                                    a.w_full,
                                    a.transition_color,
                                    active ? t.atoms.bg_contrast_25 : a.transition_delay_50ms,
                                    a.rounded_full,
                                    a.justify_between,
                                    a.align_center,
                                    a.flex_row,
                                    { gap: 6 },
                                    !leftNavMinimal && [a.pl_lg, a.pr_md],
                                ], children: [_jsx(View, { style: [
                                            !PlatformInfo.getIsReducedMotionEnabled() && [
                                                a.transition_transform,
                                                { transitionDuration: '250ms' },
                                                !active && a.transition_delay_50ms,
                                            ],
                                            a.relative,
                                            a.z_10,
                                            active && {
                                                transform: [
                                                    { scale: !leftNavMinimal ? 2 / 3 : 0.8 },
                                                    { translateX: !leftNavMinimal ? -22 : 0 },
                                                ],
                                            },
                                        ], children: _jsx(UserAvatar, { avatar: profile.avatar, size: size, type: ((_b = profile === null || profile === void 0 ? void 0 : profile.associated) === null || _b === void 0 ? void 0 : _b.labeler) ? 'labeler' : 'user', live: live }) }), !leftNavMinimal && (_jsxs(_Fragment, { children: [_jsxs(View, { style: [
                                                    a.flex_1,
                                                    a.transition_opacity,
                                                    !active && a.transition_delay_50ms,
                                                    {
                                                        marginLeft: tokens.space.xl * -1,
                                                        opacity: active ? 1 : 0,
                                                    },
                                                ], children: [_jsx(Text, { style: [a.font_bold, a.text_sm, a.leading_snug], numberOfLines: 1, children: sanitizeDisplayName(profile.displayName || profile.handle) }), _jsx(Text, { style: [
                                                            a.text_xs,
                                                            a.leading_snug,
                                                            t.atoms.text_contrast_medium,
                                                        ], numberOfLines: 1, children: sanitizeHandle(profile.handle, '@') })] }), _jsx(EllipsisIcon, { "aria-hidden": true, style: [
                                                    t.atoms.text_contrast_medium,
                                                    a.transition_opacity,
                                                    { opacity: active ? 1 : 0 },
                                                ], size: "sm" })] }))] })));
                        } }), _jsx(SwitchMenuItems, { accounts: otherAccounts, signOutPromptControl: signOutPromptControl })] })) : (_jsx(LoadingPlaceholder, { width: size, height: size, style: [{ borderRadius: size }, !leftNavMinimal && a.ml_lg] })), _jsx(Prompt.Basic, { control: signOutPromptControl, title: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Sign out?"], ["Sign out?"])))), description: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["You will be signed out of all your accounts."], ["You will be signed out of all your accounts."])))), onConfirm: function () { return logoutEveryAccount('Settings'); }, confirmButtonCta: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Sign out"], ["Sign out"])))), cancelButtonCta: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Cancel"], ["Cancel"])))), confirmButtonColor: "negative" })] }));
}
function SwitchMenuItems(_a) {
    var accounts = _a.accounts, signOutPromptControl = _a.signOutPromptControl;
    var _ = useLingui()._;
    var setShowLoggedOut = useLoggedOutViewControls().setShowLoggedOut;
    var closeEverything = useCloseAllActiveElements();
    var onAddAnotherAccount = function () {
        setShowLoggedOut(true);
        closeEverything();
    };
    return (_jsxs(Menu.Outer, { children: [accounts && accounts.length > 0 && (_jsxs(_Fragment, { children: [_jsxs(Menu.Group, { children: [_jsx(Menu.LabelText, { children: _jsx(Trans, { children: "Switch account" }) }), accounts.map(function (other) { return (_jsx(SwitchMenuItem, { account: other.account, profile: other.profile }, other.account.did)); })] }), _jsx(Menu.Divider, {})] })), _jsx(SwitcherMenuProfileLink, {}), _jsxs(Menu.Item, { label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Add another account"], ["Add another account"])))), onPress: onAddAnotherAccount, children: [_jsx(Menu.ItemIcon, { icon: PlusIcon }), _jsx(Menu.ItemText, { children: _jsx(Trans, { children: "Add another account" }) })] }), _jsxs(Menu.Item, { label: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Sign out"], ["Sign out"])))), onPress: signOutPromptControl.open, children: [_jsx(Menu.ItemIcon, { icon: LeaveIcon }), _jsx(Menu.ItemText, { children: _jsx(Trans, { children: "Sign out" }) })] })] }));
}
function SwitcherMenuProfileLink() {
    var _ = useLingui()._;
    var currentAccount = useSession().currentAccount;
    var navigation = useNavigation();
    var context = Menu.useMenuContext();
    var profileLink = currentAccount ? makeProfileLink(currentAccount) : '/';
    var pathName = useMemo(function () { return router.matchPath(profileLink); }, [profileLink])[0];
    var currentRouteInfo = useNavigationState(function (state) {
        if (!state) {
            return { name: 'Home' };
        }
        return getCurrentRoute(state);
    });
    var isCurrent = currentRouteInfo.name === 'Profile'
        ? isTab(currentRouteInfo.name, pathName) &&
            currentRouteInfo.params.name ===
                (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.handle)
        : isTab(currentRouteInfo.name, pathName);
    var onProfilePress = useCallback(function (e) {
        if (e.ctrlKey || e.metaKey || e.altKey) {
            return;
        }
        e.preventDefault();
        context.control.close();
        if (isCurrent) {
            emitSoftReset();
        }
        else {
            var _a = router.matchPath(profileLink), screen_1 = _a[0], params = _a[1];
            // @ts-expect-error TODO: type matchPath well enough that it can be plugged into navigation.navigate directly
            navigation.navigate(screen_1, params, { pop: true });
        }
    }, [navigation, profileLink, isCurrent, context]);
    return (_jsxs(Menu.Item, { label: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Go to profile"], ["Go to profile"])))), 
        // @ts-expect-error The function signature differs on web -inb
        onPress: onProfilePress, href: profileLink, children: [_jsx(Menu.ItemIcon, { icon: UserCircle }), _jsx(Menu.ItemText, { children: _jsx(Trans, { children: "Go to profile" }) })] }));
}
function SwitchMenuItem(_a) {
    var _b, _c, _d;
    var account = _a.account, profile = _a.profile;
    var _ = useLingui()._;
    var _e = useAccountSwitcher(), onPressSwitchAccount = _e.onPressSwitchAccount, pendingDid = _e.pendingDid;
    var live = useActorStatus(profile).isActive;
    return (_jsxs(Menu.Item, { disabled: !!pendingDid, style: [a.gap_sm, { minWidth: 150 }], label: _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Switch to ", ""], ["Switch to ", ""])), sanitizeHandle((_b = profile === null || profile === void 0 ? void 0 : profile.handle) !== null && _b !== void 0 ? _b : account.handle, '@'))), onPress: function () { return onPressSwitchAccount(account, 'SwitchAccount'); }, children: [_jsx(View, { children: _jsx(UserAvatar, { avatar: profile === null || profile === void 0 ? void 0 : profile.avatar, size: 20, type: ((_c = profile === null || profile === void 0 ? void 0 : profile.associated) === null || _c === void 0 ? void 0 : _c.labeler) ? 'labeler' : 'user', live: live, hideLiveBadge: true }) }), _jsx(Menu.ItemText, { children: sanitizeHandle((_d = profile === null || profile === void 0 ? void 0 : profile.handle) !== null && _d !== void 0 ? _d : account.handle, '@') })] }, account.did));
}
function NavItem(_a) {
    var count = _a.count, hasNew = _a.hasNew, href = _a.href, icon = _a.icon, iconFilled = _a.iconFilled, label = _a.label;
    var t = useTheme();
    var _ = useLingui()._;
    var currentAccount = useSession().currentAccount;
    var leftNavMinimal = useLayoutBreakpoints().leftNavMinimal;
    var pathName = useMemo(function () { return router.matchPath(href); }, [href])[0];
    var currentRouteInfo = useNavigationState(function (state) {
        if (!state) {
            return { name: 'Home' };
        }
        return getCurrentRoute(state);
    });
    var isCurrent = currentRouteInfo.name === 'Profile'
        ? isTab(currentRouteInfo.name, pathName) &&
            currentRouteInfo.params.name ===
                (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.handle)
        : isTab(currentRouteInfo.name, pathName);
    var navigation = useNavigation();
    var onPressWrapped = useCallback(function (e) {
        if (e.ctrlKey || e.metaKey || e.altKey) {
            return;
        }
        e.preventDefault();
        if (isCurrent) {
            emitSoftReset();
        }
        else {
            var _a = router.matchPath(href), screen_2 = _a[0], params = _a[1];
            // @ts-expect-error TODO: type matchPath well enough that it can be plugged into navigation.navigate directly
            navigation.navigate(screen_2, params, { pop: true });
        }
    }, [navigation, href, isCurrent]);
    return (_jsxs(PressableWithHover, { style: [
            a.flex_row,
            a.align_center,
            a.p_md,
            a.rounded_sm,
            a.gap_sm,
            a.outline_inset_1,
            a.transition_color,
        ], hoverStyle: t.atoms.bg_contrast_25, 
        // @ts-expect-error the function signature differs on web -prf
        onPress: onPressWrapped, href: href, dataSet: { noUnderline: 1 }, role: "link", accessibilityLabel: label, accessibilityHint: "", children: [_jsxs(View, { style: [
                    a.align_center,
                    a.justify_center,
                    {
                        width: 24,
                        height: 24,
                    },
                    leftNavMinimal && {
                        width: 40,
                        height: 40,
                    },
                ], children: [isCurrent ? iconFilled : icon, typeof count === 'string' && count ? (_jsx(View, { style: [
                            a.absolute,
                            a.inset_0,
                            { right: -20 }, // more breathing room
                        ], children: _jsx(Text, { accessibilityLabel: _(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["", ""], ["", ""])), plural(count, {
                                one: '# unread item',
                                other: '# unread items',
                            }))), accessibilityHint: "", accessible: true, numberOfLines: 1, style: [
                                a.absolute,
                                a.text_xs,
                                a.font_semi_bold,
                                a.rounded_full,
                                a.text_center,
                                a.leading_tight,
                                a.z_20,
                                {
                                    top: '-10%',
                                    left: count.length === 1 ? 12 : 8,
                                    backgroundColor: t.palette.primary_500,
                                    color: t.palette.white,
                                    lineHeight: a.text_sm.fontSize,
                                    paddingHorizontal: 4,
                                    paddingVertical: 1,
                                    minWidth: 16,
                                },
                                leftNavMinimal && [
                                    {
                                        top: '10%',
                                        left: count.length === 1 ? 20 : 16,
                                    },
                                ],
                            ], children: count }) })) : hasNew ? (_jsx(View, { style: [
                            a.absolute,
                            a.rounded_full,
                            a.z_20,
                            {
                                backgroundColor: t.palette.primary_500,
                                width: 8,
                                height: 8,
                                right: -2,
                                top: -4,
                            },
                            leftNavMinimal && {
                                right: 4,
                                top: 2,
                            },
                        ] })) : null] }), !leftNavMinimal && (_jsx(Text, { style: [a.text_xl, isCurrent ? a.font_bold : a.font_normal], children: label }))] }));
}
function ComposeBtn() {
    var _this = this;
    var currentAccount = useSession().currentAccount;
    var getState = useNavigation().getState;
    var openComposer = useOpenComposer().openComposer;
    var _ = useLingui()._;
    var leftNavMinimal = useLayoutBreakpoints().leftNavMinimal;
    var _a = useState(false), isFetchingHandle = _a[0], setIsFetchingHandle = _a[1];
    var fetchHandle = useFetchHandle();
    var getProfileHandle = function () { return __awaiter(_this, void 0, void 0, function () {
        var routes, currentRoute, handle, e_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    routes = (_a = getState()) === null || _a === void 0 ? void 0 : _a.routes;
                    currentRoute = routes === null || routes === void 0 ? void 0 : routes[(routes === null || routes === void 0 ? void 0 : routes.length) - 1];
                    if (!((currentRoute === null || currentRoute === void 0 ? void 0 : currentRoute.name) === 'Profile')) return [3 /*break*/, 6];
                    handle = currentRoute.params.name;
                    if (!handle.startsWith('did:')) return [3 /*break*/, 5];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, 4, 5]);
                    setIsFetchingHandle(true);
                    return [4 /*yield*/, fetchHandle(handle)];
                case 2:
                    handle = _b.sent();
                    return [3 /*break*/, 5];
                case 3:
                    e_1 = _b.sent();
                    handle = undefined;
                    return [3 /*break*/, 5];
                case 4:
                    setIsFetchingHandle(false);
                    return [7 /*endfinally*/];
                case 5:
                    if (!handle ||
                        handle === (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.handle) ||
                        isInvalidHandle(handle))
                        return [2 /*return*/, undefined];
                    return [2 /*return*/, handle];
                case 6: return [2 /*return*/, undefined];
            }
        });
    }); };
    var onPressCompose = function () { return __awaiter(_this, void 0, void 0, function () {
        var _a;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _a = openComposer;
                    _b = {};
                    return [4 /*yield*/, getProfileHandle()];
                case 1: return [2 /*return*/, _a.apply(void 0, [(_b.mention = _c.sent(), _b)])];
            }
        });
    }); };
    if (leftNavMinimal) {
        return null;
    }
    return (_jsx(View, { style: [a.flex_row, a.pl_md, a.pt_xl], children: _jsxs(Button, { disabled: isFetchingHandle, label: _(msg(templateObject_11 || (templateObject_11 = __makeTemplateObject(["Compose new post"], ["Compose new post"])))), onPress: onPressCompose, size: "large", variant: "solid", color: "primary", style: [a.rounded_full], children: [_jsx(ButtonIcon, { icon: EditBig, position: "left" }), _jsx(ButtonText, { children: _jsx(Trans, { context: "action", children: "New Post" }) })] }) }));
}
function ChatNavItem() {
    var pal = usePalette('default');
    var _ = useLingui()._;
    var numUnreadMessages = useUnreadMessageCount();
    return (_jsx(NavItem, { href: "/messages", count: numUnreadMessages.numUnread, hasNew: numUnreadMessages.hasNew, icon: _jsx(Message, { style: pal.text, "aria-hidden": true, width: NAV_ICON_WIDTH }), iconFilled: _jsx(MessageFilled, { style: pal.text, "aria-hidden": true, width: NAV_ICON_WIDTH }), label: _(msg(templateObject_12 || (templateObject_12 = __makeTemplateObject(["Chat"], ["Chat"])))) }));
}
export function DesktopLeftNav() {
    var _a = useSession(), hasSession = _a.hasSession, currentAccount = _a.currentAccount;
    var pal = usePalette('default');
    var _ = useLingui()._;
    var isDesktop = useWebMediaQueries().isDesktop;
    var _b = useLayoutBreakpoints(), leftNavMinimal = _b.leftNavMinimal, centerColumnOffset = _b.centerColumnOffset;
    var numUnreadNotifications = useUnreadNotifications();
    if (!hasSession && !isDesktop) {
        return null;
    }
    return (_jsxs(View, { role: "navigation", style: [
            a.px_xl,
            styles.leftNav,
            leftNavMinimal && styles.leftNavMinimal,
            {
                transform: __spreadArray([
                    {
                        translateX: -300 + (centerColumnOffset ? CENTER_COLUMN_OFFSET : 0),
                    },
                    { translateX: '-100%' }
                ], a.scrollbar_offset.transform, true),
            },
        ], children: [hasSession ? (_jsx(ProfileCard, {})) : !leftNavMinimal ? (_jsx(View, { style: [a.pt_xl], children: _jsx(NavSignupCard, {}) })) : null, hasSession && (_jsxs(_Fragment, { children: [_jsx(NavItem, { href: "/", icon: _jsx(Home, { "aria-hidden": true, width: NAV_ICON_WIDTH, style: pal.text }), iconFilled: _jsx(HomeFilled, { "aria-hidden": true, width: NAV_ICON_WIDTH, style: pal.text }), label: _(msg(templateObject_13 || (templateObject_13 = __makeTemplateObject(["Home"], ["Home"])))) }), _jsx(NavItem, { href: "/search", icon: _jsx(MagnifyingGlass, { style: pal.text, "aria-hidden": true, width: NAV_ICON_WIDTH }), iconFilled: _jsx(MagnifyingGlassFilled, { style: pal.text, "aria-hidden": true, width: NAV_ICON_WIDTH }), label: _(msg(templateObject_14 || (templateObject_14 = __makeTemplateObject(["Explore"], ["Explore"])))) }), _jsx(NavItem, { href: "/notifications", count: numUnreadNotifications, icon: _jsx(Bell, { "aria-hidden": true, width: NAV_ICON_WIDTH, style: pal.text }), iconFilled: _jsx(BellFilled, { "aria-hidden": true, width: NAV_ICON_WIDTH, style: pal.text }), label: _(msg(templateObject_15 || (templateObject_15 = __makeTemplateObject(["Notifications"], ["Notifications"])))) }), _jsx(ChatNavItem, {}), _jsx(NavItem, { href: "/feeds", icon: _jsx(Hashtag, { style: pal.text, "aria-hidden": true, width: NAV_ICON_WIDTH }), iconFilled: _jsx(HashtagFilled, { style: pal.text, "aria-hidden": true, width: NAV_ICON_WIDTH }), label: _(msg(templateObject_16 || (templateObject_16 = __makeTemplateObject(["Feeds"], ["Feeds"])))) }), _jsx(NavItem, { href: "/lists", icon: _jsx(List, { style: pal.text, "aria-hidden": true, width: NAV_ICON_WIDTH }), iconFilled: _jsx(ListFilled, { style: pal.text, "aria-hidden": true, width: NAV_ICON_WIDTH }), label: _(msg(templateObject_17 || (templateObject_17 = __makeTemplateObject(["Lists"], ["Lists"])))) }), _jsx(NavItem, { href: "/saved", icon: _jsx(Bookmark, { style: pal.text, "aria-hidden": true, width: NAV_ICON_WIDTH }), iconFilled: _jsx(BookmarkFilled, { style: pal.text, "aria-hidden": true, width: NAV_ICON_WIDTH }), label: _(msg({
                            message: 'Saved',
                            context: 'link to bookmarks screen',
                        })) }), _jsx(NavItem, { href: currentAccount ? makeProfileLink(currentAccount) : '/', icon: _jsx(UserCircle, { "aria-hidden": true, width: NAV_ICON_WIDTH, style: pal.text }), iconFilled: _jsx(UserCircleFilled, { "aria-hidden": true, width: NAV_ICON_WIDTH, style: pal.text }), label: _(msg(templateObject_18 || (templateObject_18 = __makeTemplateObject(["Profile"], ["Profile"])))) }), _jsx(NavItem, { href: "/settings", icon: _jsx(Settings, { "aria-hidden": true, width: NAV_ICON_WIDTH, style: pal.text }), iconFilled: _jsx(SettingsFilled, { "aria-hidden": true, width: NAV_ICON_WIDTH, style: pal.text }), label: _(msg(templateObject_19 || (templateObject_19 = __makeTemplateObject(["Settings"], ["Settings"])))) }), _jsx(ComposeBtn, {})] }))] }));
}
var styles = StyleSheet.create({
    leftNav: __assign(__assign({}, a.fixed), { top: 0, paddingTop: 10, paddingBottom: 10, left: '50%', width: 240, 
        // @ts-expect-error web only
        maxHeight: '100vh', overflowY: 'auto' }),
    leftNavMinimal: __assign({ paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: 0, height: '100%', width: 86, alignItems: 'center' }, web({ overflowX: 'hidden' })),
    backBtn: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 30,
        height: 30,
    },
});
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15, templateObject_16, templateObject_17, templateObject_18, templateObject_19;
