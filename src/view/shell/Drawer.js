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
import React from 'react';
import { Linking, ScrollView, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { msg, plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Plural, Trans } from '@lingui/react/macro';
import { StackActions, useNavigation } from '@react-navigation/native';
import { FEEDBACK_FORM_URL, HELP_DESK_URL } from '#/lib/constants';
import { useNavigationTabState } from '#/lib/hooks/useNavigationTabState';
import { getTabState, TabState } from '#/lib/routes/helpers';
import { sanitizeHandle } from '#/lib/strings/handles';
import { colors } from '#/lib/styles';
import { emitSoftReset } from '#/state/events';
import { useKawaiiMode } from '#/state/preferences/kawaii';
import { useUnreadNotifications } from '#/state/queries/notifications/unread';
import { useProfileQuery } from '#/state/queries/profile';
import { useSession } from '#/state/session';
import { useSetDrawerOpen } from '#/state/shell';
import { formatCount } from '#/view/com/util/numeric/format';
import { UserAvatar } from '#/view/com/util/UserAvatar';
import { NavSignupCard } from '#/view/shell/NavSignupCard';
import { atoms as a, tokens, useTheme, web } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { Divider } from '#/components/Divider';
import { Bell_Filled_Corner0_Rounded as BellFilled, Bell_Stroke2_Corner0_Rounded as Bell, } from '#/components/icons/Bell';
import { Bookmark, BookmarkFilled } from '#/components/icons/Bookmark';
import { BulletList_Stroke2_Corner0_Rounded as List } from '#/components/icons/BulletList';
import { Hashtag_Filled_Corner0_Rounded as HashtagFilled, Hashtag_Stroke2_Corner0_Rounded as Hashtag, } from '#/components/icons/Hashtag';
import { HomeOpen_Filled_Corner0_Rounded as HomeFilled, HomeOpen_Stoke2_Corner0_Rounded as Home, } from '#/components/icons/HomeOpen';
import { MagnifyingGlass_Filled_Stroke2_Corner0_Rounded as MagnifyingGlassFilled, MagnifyingGlass_Stroke2_Corner0_Rounded as MagnifyingGlass, } from '#/components/icons/MagnifyingGlass';
import { Message_Stroke2_Corner0_Rounded as Message, Message_Stroke2_Corner0_Rounded_Filled as MessageFilled, } from '#/components/icons/Message';
import { SettingsGear2_Stroke2_Corner0_Rounded as Settings } from '#/components/icons/SettingsGear2';
import { UserCircle_Filled_Corner0_Rounded as UserCircleFilled, UserCircle_Stroke2_Corner0_Rounded as UserCircle, } from '#/components/icons/UserCircle';
import { InlineLinkText } from '#/components/Link';
import { Text } from '#/components/Typography';
import { useSimpleVerificationState } from '#/components/verification';
import { VerificationCheck } from '#/components/verification/VerificationCheck';
import { IS_WEB } from '#/env';
import { useActorStatus } from '#/features/liveNow';
var iconWidth = 26;
var DrawerProfileCard = function (_a) {
    var _b, _c, _d;
    var account = _a.account, onPressProfile = _a.onPressProfile;
    var _e = useLingui(), _ = _e._, i18n = _e.i18n;
    var t = useTheme();
    var profile = useProfileQuery({ did: account.did }).data;
    var verification = useSimpleVerificationState({ profile: profile });
    var live = useActorStatus(profile).isActive;
    return (_jsxs(TouchableOpacity, { testID: "profileCardButton", accessibilityLabel: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Profile"], ["Profile"])))), accessibilityHint: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Navigates to your profile"], ["Navigates to your profile"])))), onPress: onPressProfile, style: [a.gap_sm, a.pr_lg], children: [_jsx(UserAvatar, { size: 52, avatar: profile === null || profile === void 0 ? void 0 : profile.avatar, 
                // See https://github.com/bluesky-social/social-app/pull/1801:
                usePlainRNImage: true, type: ((_b = profile === null || profile === void 0 ? void 0 : profile.associated) === null || _b === void 0 ? void 0 : _b.labeler) ? 'labeler' : 'user', live: live }), _jsxs(View, { style: [a.gap_2xs], children: [_jsxs(View, { style: [a.flex_row, a.align_center, a.gap_xs, a.flex_1], children: [_jsx(Text, { emoji: true, style: [a.font_bold, a.text_xl, a.mt_2xs, a.leading_tight], numberOfLines: 1, children: (profile === null || profile === void 0 ? void 0 : profile.displayName) || account.handle }), verification.showBadge && (_jsx(View, { style: {
                                    top: 0,
                                }, children: _jsx(VerificationCheck, { width: 16, verifier: verification.role === 'verifier' }) }))] }), _jsx(Text, { emoji: true, style: [t.atoms.text_contrast_medium, a.text_md, a.leading_tight], numberOfLines: 1, children: sanitizeHandle(account.handle, '@') })] }), _jsxs(Text, { style: [a.text_md, t.atoms.text_contrast_medium], children: [_jsxs(Trans, { children: [_jsx(Text, { style: [a.text_md, a.font_semi_bold], children: formatCount(i18n, (_c = profile === null || profile === void 0 ? void 0 : profile.followersCount) !== null && _c !== void 0 ? _c : 0) }), ' ', _jsx(Plural, { value: (profile === null || profile === void 0 ? void 0 : profile.followersCount) || 0, one: "follower", other: "followers" })] }), ' ', "\u00B7", ' ', _jsxs(Trans, { children: [_jsx(Text, { style: [a.text_md, a.font_semi_bold], children: formatCount(i18n, (_d = profile === null || profile === void 0 ? void 0 : profile.followsCount) !== null && _d !== void 0 ? _d : 0) }), ' ', _jsx(Plural, { value: (profile === null || profile === void 0 ? void 0 : profile.followsCount) || 0, one: "following", other: "following" })] })] })] }));
};
DrawerProfileCard = React.memo(DrawerProfileCard);
export { DrawerProfileCard };
var DrawerContent = function (_a) {
    var t = useTheme();
    var insets = useSafeAreaInsets();
    var setDrawerOpen = useSetDrawerOpen();
    var navigation = useNavigation();
    var _b = useNavigationTabState(), isAtHome = _b.isAtHome, isAtSearch = _b.isAtSearch, isAtFeeds = _b.isAtFeeds, isAtBookmarks = _b.isAtBookmarks, isAtNotifications = _b.isAtNotifications, isAtMyProfile = _b.isAtMyProfile, isAtMessages = _b.isAtMessages;
    var _c = useSession(), hasSession = _c.hasSession, currentAccount = _c.currentAccount;
    // events
    // =
    var onPressTab = React.useCallback(function (tab) {
        var _a, _b;
        var state = navigation.getState();
        setDrawerOpen(false);
        if (IS_WEB) {
            // hack because we have flat navigator for web and MyProfile does not exist on the web navigator -ansh
            if (tab === 'MyProfile') {
                navigation.navigate('Profile', { name: currentAccount.handle });
            }
            else {
                // @ts-expect-error struggles with string unions, apparently
                navigation.navigate(tab);
            }
        }
        else {
            var tabState = getTabState(state, tab);
            if (tabState === TabState.InsideAtRoot) {
                emitSoftReset();
            }
            else if (tabState === TabState.Inside) {
                // find the correct navigator in which to pop-to-top
                var target = (_b = (_a = state.routes.find(function (route) { return route.name === "".concat(tab, "Tab"); })) === null || _a === void 0 ? void 0 : _a.state) === null || _b === void 0 ? void 0 : _b.key;
                if (target) {
                    // if we found it, trigger pop-to-top
                    navigation.dispatch(__assign(__assign({}, StackActions.popToTop()), { target: target }));
                }
                else {
                    // fallback: reset navigation
                    navigation.reset({
                        index: 0,
                        routes: [{ name: "".concat(tab, "Tab") }],
                    });
                }
            }
            else {
                navigation.navigate("".concat(tab, "Tab"));
            }
        }
    }, [navigation, setDrawerOpen, currentAccount]);
    var onPressHome = React.useCallback(function () { return onPressTab('Home'); }, [onPressTab]);
    var onPressSearch = React.useCallback(function () { return onPressTab('Search'); }, [onPressTab]);
    var onPressMessages = React.useCallback(function () { return onPressTab('Messages'); }, [onPressTab]);
    var onPressNotifications = React.useCallback(function () { return onPressTab('Notifications'); }, [onPressTab]);
    var onPressProfile = React.useCallback(function () {
        onPressTab('MyProfile');
    }, [onPressTab]);
    var onPressMyFeeds = React.useCallback(function () {
        navigation.navigate('Feeds');
        setDrawerOpen(false);
    }, [navigation, setDrawerOpen]);
    var onPressLists = React.useCallback(function () {
        navigation.navigate('Lists');
        setDrawerOpen(false);
    }, [navigation, setDrawerOpen]);
    var onPressBookmarks = React.useCallback(function () {
        navigation.navigate('Bookmarks');
        setDrawerOpen(false);
    }, [navigation, setDrawerOpen]);
    var onPressSettings = React.useCallback(function () {
        navigation.navigate('Settings');
        setDrawerOpen(false);
    }, [navigation, setDrawerOpen]);
    var onPressFeedback = React.useCallback(function () {
        Linking.openURL(FEEDBACK_FORM_URL({
            email: currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.email,
            handle: currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.handle,
        }));
    }, [currentAccount]);
    var onPressHelp = React.useCallback(function () {
        Linking.openURL(HELP_DESK_URL);
    }, []);
    // rendering
    // =
    return (_jsxs(View, { testID: "drawer", style: [a.flex_1, a.border_r, t.atoms.bg, t.atoms.border_contrast_low], children: [_jsxs(ScrollView, { style: [a.flex_1], contentContainerStyle: [
                    {
                        paddingTop: Math.max(insets.top + a.pt_xl.paddingTop, a.pt_xl.paddingTop),
                    },
                ], children: [_jsxs(View, { style: [a.px_xl], children: [hasSession && currentAccount ? (_jsx(DrawerProfileCard, { account: currentAccount, onPressProfile: onPressProfile })) : (_jsx(View, { style: [a.pr_xl], children: _jsx(NavSignupCard, {}) })), _jsx(Divider, { style: [a.mt_xl, a.mb_sm] })] }), hasSession ? (_jsxs(_Fragment, { children: [_jsx(SearchMenuItem, { isActive: isAtSearch, onPress: onPressSearch }), _jsx(HomeMenuItem, { isActive: isAtHome, onPress: onPressHome }), _jsx(ChatMenuItem, { isActive: isAtMessages, onPress: onPressMessages }), _jsx(NotificationsMenuItem, { isActive: isAtNotifications, onPress: onPressNotifications }), _jsx(FeedsMenuItem, { isActive: isAtFeeds, onPress: onPressMyFeeds }), _jsx(ListsMenuItem, { onPress: onPressLists }), _jsx(BookmarksMenuItem, { isActive: isAtBookmarks, onPress: onPressBookmarks }), _jsx(ProfileMenuItem, { isActive: isAtMyProfile, onPress: onPressProfile }), _jsx(SettingsMenuItem, { onPress: onPressSettings })] })) : (_jsxs(_Fragment, { children: [_jsx(HomeMenuItem, { isActive: isAtHome, onPress: onPressHome }), _jsx(FeedsMenuItem, { isActive: isAtFeeds, onPress: onPressMyFeeds }), _jsx(SearchMenuItem, { isActive: isAtSearch, onPress: onPressSearch })] })), _jsxs(View, { style: [a.px_xl], children: [_jsx(Divider, { style: [a.mb_xl, a.mt_sm] }), _jsx(ExtraLinks, {})] })] }), _jsx(DrawerFooter, { onPressFeedback: onPressFeedback, onPressHelp: onPressHelp })] }));
};
DrawerContent = React.memo(DrawerContent);
export { DrawerContent };
var DrawerFooter = function (_a) {
    var onPressFeedback = _a.onPressFeedback, onPressHelp = _a.onPressHelp;
    var _ = useLingui()._;
    var insets = useSafeAreaInsets();
    return (_jsxs(View, { style: [
            a.flex_row,
            a.gap_sm,
            a.flex_wrap,
            a.pl_xl,
            a.pt_md,
            {
                paddingBottom: Math.max(insets.bottom + tokens.space.xs, tokens.space.xl),
            },
        ], children: [_jsxs(Button, { label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Send feedback"], ["Send feedback"])))), size: "small", variant: "solid", color: "secondary", onPress: onPressFeedback, children: [_jsx(ButtonIcon, { icon: Message, position: "left" }), _jsx(ButtonText, { children: _jsx(Trans, { children: "Feedback" }) })] }), _jsx(Button, { label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Get help"], ["Get help"])))), size: "small", variant: "outline", color: "secondary", onPress: onPressHelp, style: {
                    backgroundColor: 'transparent',
                }, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Help" }) }) })] }));
};
DrawerFooter = React.memo(DrawerFooter);
var SearchMenuItem = function (_a) {
    var isActive = _a.isActive, onPress = _a.onPress;
    var _ = useLingui()._;
    var t = useTheme();
    return (_jsx(MenuItem, { icon: isActive ? (_jsx(MagnifyingGlassFilled, { style: [t.atoms.text], width: iconWidth })) : (_jsx(MagnifyingGlass, { style: [t.atoms.text], width: iconWidth })), label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Explore"], ["Explore"])))), bold: isActive, onPress: onPress }));
};
SearchMenuItem = React.memo(SearchMenuItem);
var HomeMenuItem = function (_a) {
    var isActive = _a.isActive, onPress = _a.onPress;
    var _ = useLingui()._;
    var t = useTheme();
    return (_jsx(MenuItem, { icon: isActive ? (_jsx(HomeFilled, { style: [t.atoms.text], width: iconWidth })) : (_jsx(Home, { style: [t.atoms.text], width: iconWidth })), label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Home"], ["Home"])))), bold: isActive, onPress: onPress }));
};
HomeMenuItem = React.memo(HomeMenuItem);
var ChatMenuItem = function (_a) {
    var isActive = _a.isActive, onPress = _a.onPress;
    var _ = useLingui()._;
    var t = useTheme();
    return (_jsx(MenuItem, { icon: isActive ? (_jsx(MessageFilled, { style: [t.atoms.text], width: iconWidth })) : (_jsx(Message, { style: [t.atoms.text], width: iconWidth })), label: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Chat"], ["Chat"])))), bold: isActive, onPress: onPress }));
};
ChatMenuItem = React.memo(ChatMenuItem);
var NotificationsMenuItem = function (_a) {
    var isActive = _a.isActive, onPress = _a.onPress;
    var _ = useLingui()._;
    var t = useTheme();
    var numUnreadNotifications = useUnreadNotifications();
    return (_jsx(MenuItem, { icon: isActive ? (_jsx(BellFilled, { style: [t.atoms.text], width: iconWidth })) : (_jsx(Bell, { style: [t.atoms.text], width: iconWidth })), label: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Notifications"], ["Notifications"])))), accessibilityHint: numUnreadNotifications === ''
            ? ''
            : _(plural(numUnreadNotifications !== null && numUnreadNotifications !== void 0 ? numUnreadNotifications : 0, {
                one: '# unread item',
                other: '# unread items',
            })), count: numUnreadNotifications, bold: isActive, onPress: onPress }));
};
NotificationsMenuItem = React.memo(NotificationsMenuItem);
var FeedsMenuItem = function (_a) {
    var isActive = _a.isActive, onPress = _a.onPress;
    var _ = useLingui()._;
    var t = useTheme();
    return (_jsx(MenuItem, { icon: isActive ? (_jsx(HashtagFilled, { width: iconWidth, style: [t.atoms.text] })) : (_jsx(Hashtag, { width: iconWidth, style: [t.atoms.text] })), label: _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Feeds"], ["Feeds"])))), bold: isActive, onPress: onPress }));
};
FeedsMenuItem = React.memo(FeedsMenuItem);
var ListsMenuItem = function (_a) {
    var onPress = _a.onPress;
    var _ = useLingui()._;
    var t = useTheme();
    return (_jsx(MenuItem, { icon: _jsx(List, { style: [t.atoms.text], width: iconWidth }), label: _(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["Lists"], ["Lists"])))), onPress: onPress }));
};
ListsMenuItem = React.memo(ListsMenuItem);
var BookmarksMenuItem = function (_a) {
    var isActive = _a.isActive, onPress = _a.onPress;
    var _ = useLingui()._;
    var t = useTheme();
    return (_jsx(MenuItem, { icon: isActive ? (_jsx(BookmarkFilled, { style: [t.atoms.text], width: iconWidth })) : (_jsx(Bookmark, { style: [t.atoms.text], width: iconWidth })), label: _(msg({ message: 'Saved', context: 'link to bookmarks screen' })), onPress: onPress }));
};
BookmarksMenuItem = React.memo(BookmarksMenuItem);
var ProfileMenuItem = function (_a) {
    var isActive = _a.isActive, onPress = _a.onPress;
    var _ = useLingui()._;
    var t = useTheme();
    return (_jsx(MenuItem, { icon: isActive ? (_jsx(UserCircleFilled, { style: [t.atoms.text], width: iconWidth })) : (_jsx(UserCircle, { style: [t.atoms.text], width: iconWidth })), label: _(msg(templateObject_11 || (templateObject_11 = __makeTemplateObject(["Profile"], ["Profile"])))), onPress: onPress }));
};
ProfileMenuItem = React.memo(ProfileMenuItem);
var SettingsMenuItem = function (_a) {
    var onPress = _a.onPress;
    var _ = useLingui()._;
    var t = useTheme();
    return (_jsx(MenuItem, { icon: _jsx(Settings, { style: [t.atoms.text], width: iconWidth }), label: _(msg(templateObject_12 || (templateObject_12 = __makeTemplateObject(["Settings"], ["Settings"])))), onPress: onPress }));
};
SettingsMenuItem = React.memo(SettingsMenuItem);
function MenuItem(_a) {
    var icon = _a.icon, label = _a.label, count = _a.count, bold = _a.bold, onPress = _a.onPress;
    var t = useTheme();
    return (_jsx(Button, { testID: "menuItemButton-".concat(label), onPress: onPress, accessibilityRole: "tab", label: label, children: function (_a) {
            var hovered = _a.hovered, pressed = _a.pressed;
            return (_jsxs(View, { style: [
                    a.flex_1,
                    a.flex_row,
                    a.align_center,
                    a.gap_md,
                    a.py_md,
                    a.px_xl,
                    (hovered || pressed) && t.atoms.bg_contrast_25,
                ], children: [_jsxs(View, { style: [a.relative], children: [icon, count ? (_jsx(View, { style: [
                                    a.absolute,
                                    a.inset_0,
                                    a.align_end,
                                    { top: -4, right: a.gap_sm.gap * -1 },
                                ], children: _jsx(View, { style: [
                                        a.rounded_full,
                                        {
                                            right: count.length === 1 ? 6 : 0,
                                            paddingHorizontal: 4,
                                            paddingVertical: 1,
                                            backgroundColor: t.palette.primary_500,
                                        },
                                    ], children: _jsx(Text, { style: [
                                            a.text_xs,
                                            a.leading_tight,
                                            a.font_semi_bold,
                                            {
                                                fontVariant: ['tabular-nums'],
                                                color: colors.white,
                                            },
                                        ], numberOfLines: 1, children: count }) }) })) : undefined] }), _jsx(Text, { style: [
                            a.flex_1,
                            a.text_2xl,
                            bold && a.font_bold,
                            web(a.leading_snug),
                        ], numberOfLines: 1, children: label })] }));
        } }));
}
function ExtraLinks() {
    var _ = useLingui()._;
    var t = useTheme();
    var kawaii = useKawaiiMode();
    return (_jsxs(View, { style: [a.flex_col, a.gap_md, a.flex_wrap], children: [_jsx(InlineLinkText, { style: [a.text_md], label: _(msg(templateObject_13 || (templateObject_13 = __makeTemplateObject(["Terms of Service"], ["Terms of Service"])))), to: "https://bsky.social/about/support/tos", children: _jsx(Trans, { children: "Terms of Service" }) }), _jsx(InlineLinkText, { style: [a.text_md], to: "https://bsky.social/about/support/privacy-policy", label: _(msg(templateObject_14 || (templateObject_14 = __makeTemplateObject(["Privacy Policy"], ["Privacy Policy"])))), children: _jsx(Trans, { children: "Privacy Policy" }) }), kawaii && (_jsx(Text, { style: t.atoms.text_contrast_medium, children: _jsxs(Trans, { children: ["Logo by", ' ', _jsx(InlineLinkText, { style: [a.text_md], to: "/profile/sawaratsuki.bsky.social", label: "@sawaratsuki.bsky.social", children: "@sawaratsuki.bsky.social" })] }) }))] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14;
