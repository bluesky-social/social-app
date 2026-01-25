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
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { msg, plural, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { StackActions } from '@react-navigation/native';
import { useActorStatus } from '#/lib/actor-status';
import { PressableScale } from '#/lib/custom-animations/PressableScale';
import { BOTTOM_BAR_AVI } from '#/lib/demo';
import { useHaptics } from '#/lib/haptics';
import { useDedupe } from '#/lib/hooks/useDedupe';
import { useHideBottomBarBorder } from '#/lib/hooks/useHideBottomBarBorder';
import { useMinimalShellFooterTransform } from '#/lib/hooks/useMinimalShellTransform';
import { useNavigationTabState } from '#/lib/hooks/useNavigationTabState';
import { usePalette } from '#/lib/hooks/usePalette';
import { clamp } from '#/lib/numbers';
import { getTabState, TabState } from '#/lib/routes/helpers';
import { emitSoftReset } from '#/state/events';
import { useUnreadMessageCount } from '#/state/queries/messages/list-conversations';
import { useUnreadNotifications } from '#/state/queries/notifications/unread';
import { useProfileQuery } from '#/state/queries/profile';
import { useSession } from '#/state/session';
import { useLoggedOutViewControls } from '#/state/shell/logged-out';
import { useShellLayout } from '#/state/shell/shell-layout';
import { useCloseAllActiveElements } from '#/state/util';
import { UserAvatar } from '#/view/com/util/UserAvatar';
import { Logo } from '#/view/icons/Logo';
import { Logotype } from '#/view/icons/Logotype';
import { atoms as a, useTheme } from '#/alf';
import { Button, ButtonText } from '#/components/Button';
import { useDialogControl } from '#/components/Dialog';
import { SwitchAccountDialog } from '#/components/dialogs/SwitchAccount';
import { Bell_Filled_Corner0_Rounded as BellFilled, Bell_Stroke2_Corner0_Rounded as Bell, } from '#/components/icons/Bell';
import { HomeOpen_Filled_Corner0_Rounded as HomeFilled, HomeOpen_Stoke2_Corner0_Rounded as Home, } from '#/components/icons/HomeOpen';
import { MagnifyingGlass_Filled_Stroke2_Corner0_Rounded as MagnifyingGlassFilled, MagnifyingGlass_Stroke2_Corner0_Rounded as MagnifyingGlass, } from '#/components/icons/MagnifyingGlass';
import { Message_Stroke2_Corner0_Rounded as Message, Message_Stroke2_Corner0_Rounded_Filled as MessageFilled, } from '#/components/icons/Message';
import { Text } from '#/components/Typography';
import { useDemoMode } from '#/storage/hooks/demo-mode';
import { styles } from './BottomBarStyles';
export function BottomBar(_a) {
    var _b, _c, _d;
    var navigation = _a.navigation;
    var _e = useSession(), hasSession = _e.hasSession, currentAccount = _e.currentAccount;
    var pal = usePalette('default');
    var _ = useLingui()._;
    var safeAreaInsets = useSafeAreaInsets();
    var footerHeight = useShellLayout().footerHeight;
    var _f = useNavigationTabState(), isAtHome = _f.isAtHome, isAtSearch = _f.isAtSearch, isAtNotifications = _f.isAtNotifications, isAtMyProfile = _f.isAtMyProfile, isAtMessages = _f.isAtMessages;
    var numUnreadNotifications = useUnreadNotifications();
    var numUnreadMessages = useUnreadMessageCount();
    var footerMinimalShellTransform = useMinimalShellFooterTransform();
    var profile = useProfileQuery({ did: currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did }).data;
    var requestSwitchToAccount = useLoggedOutViewControls().requestSwitchToAccount;
    var closeAllActiveElements = useCloseAllActiveElements();
    var dedupe = useDedupe();
    var accountSwitchControl = useDialogControl();
    var playHaptic = useHaptics();
    var hideBorder = useHideBottomBarBorder();
    var iconWidth = 28;
    var showSignIn = useCallback(function () {
        closeAllActiveElements();
        requestSwitchToAccount({ requestedAccount: 'none' });
    }, [requestSwitchToAccount, closeAllActiveElements]);
    var showCreateAccount = useCallback(function () {
        closeAllActiveElements();
        requestSwitchToAccount({ requestedAccount: 'new' });
        // setShowLoggedOut(true)
    }, [requestSwitchToAccount, closeAllActiveElements]);
    var onPressTab = useCallback(function (tab) {
        var _a, _b;
        var state = navigation.getState();
        var tabState = getTabState(state, tab);
        if (tabState === TabState.InsideAtRoot) {
            emitSoftReset();
        }
        else if (tabState === TabState.Inside) {
            // find the correct navigator in which to pop-to-top
            var target_1 = (_b = (_a = state.routes.find(function (route) { return route.name === "".concat(tab, "Tab"); })) === null || _a === void 0 ? void 0 : _a.state) === null || _b === void 0 ? void 0 : _b.key;
            dedupe(function () {
                if (target_1) {
                    // if we found it, trigger pop-to-top
                    navigation.dispatch(__assign(__assign({}, StackActions.popToTop()), { target: target_1 }));
                }
                else {
                    // fallback: reset navigation
                    navigation.reset({
                        index: 0,
                        routes: [{ name: "".concat(tab, "Tab") }],
                    });
                }
            });
        }
        else {
            dedupe(function () { return navigation.navigate("".concat(tab, "Tab")); });
        }
    }, [navigation, dedupe]);
    var onPressHome = useCallback(function () { return onPressTab('Home'); }, [onPressTab]);
    var onPressSearch = useCallback(function () { return onPressTab('Search'); }, [onPressTab]);
    var onPressNotifications = useCallback(function () { return onPressTab('Notifications'); }, [onPressTab]);
    var onPressProfile = useCallback(function () {
        onPressTab('MyProfile');
    }, [onPressTab]);
    var onPressMessages = useCallback(function () {
        onPressTab('Messages');
    }, [onPressTab]);
    var onLongPressProfile = useCallback(function () {
        playHaptic();
        accountSwitchControl.open();
    }, [accountSwitchControl, playHaptic]);
    var demoMode = useDemoMode()[0];
    var live = useActorStatus(profile).isActive;
    return (_jsxs(_Fragment, { children: [_jsx(SwitchAccountDialog, { control: accountSwitchControl }), _jsx(Animated.View, { style: [
                    styles.bottomBar,
                    pal.view,
                    hideBorder ? { borderColor: pal.view.backgroundColor } : pal.border,
                    { paddingBottom: clamp(safeAreaInsets.bottom, 15, 60) },
                    footerMinimalShellTransform,
                ], onLayout: function (e) {
                    footerHeight.set(e.nativeEvent.layout.height);
                }, children: hasSession ? (_jsxs(_Fragment, { children: [_jsx(Btn, { testID: "bottomBarHomeBtn", icon: isAtHome ? (_jsx(HomeFilled, { width: iconWidth + 1, style: [styles.ctrlIcon, pal.text, styles.homeIcon] })) : (_jsx(Home, { width: iconWidth + 1, style: [styles.ctrlIcon, pal.text, styles.homeIcon] })), onPress: onPressHome, accessibilityRole: "tab", accessibilityLabel: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Home"], ["Home"])))), accessibilityHint: "" }), _jsx(Btn, { icon: isAtSearch ? (_jsx(MagnifyingGlassFilled, { width: iconWidth + 2, style: [styles.ctrlIcon, pal.text, styles.searchIcon] })) : (_jsx(MagnifyingGlass, { testID: "bottomBarSearchBtn", width: iconWidth + 2, style: [styles.ctrlIcon, pal.text, styles.searchIcon] })), onPress: onPressSearch, accessibilityRole: "search", accessibilityLabel: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Search"], ["Search"])))), accessibilityHint: "" }), _jsx(Btn, { testID: "bottomBarMessagesBtn", icon: isAtMessages ? (_jsx(MessageFilled, { width: iconWidth - 1, style: [styles.ctrlIcon, pal.text, styles.feedsIcon] })) : (_jsx(Message, { width: iconWidth - 1, style: [styles.ctrlIcon, pal.text, styles.feedsIcon] })), onPress: onPressMessages, notificationCount: numUnreadMessages.numUnread, hasNew: numUnreadMessages.hasNew, accessible: true, accessibilityRole: "tab", accessibilityLabel: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Chat"], ["Chat"])))), accessibilityHint: numUnreadMessages.count > 0
                                ? _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["", ""], ["", ""])), plural((_b = numUnreadMessages.numUnread) !== null && _b !== void 0 ? _b : 0, {
                                    one: '# unread item',
                                    other: '# unread items',
                                })) || '')
                                : '' }), _jsx(Btn, { testID: "bottomBarNotificationsBtn", icon: isAtNotifications ? (_jsx(BellFilled, { width: iconWidth, style: [styles.ctrlIcon, pal.text, styles.bellIcon] })) : (_jsx(Bell, { width: iconWidth, style: [styles.ctrlIcon, pal.text, styles.bellIcon] })), onPress: onPressNotifications, notificationCount: numUnreadNotifications, accessible: true, accessibilityRole: "tab", accessibilityLabel: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Notifications"], ["Notifications"])))), accessibilityHint: numUnreadNotifications === ''
                                ? ''
                                : _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["", ""], ["", ""])), plural(numUnreadNotifications !== null && numUnreadNotifications !== void 0 ? numUnreadNotifications : 0, {
                                    one: '# unread item',
                                    other: '# unread items',
                                })) || '') }), _jsx(Btn, { testID: "bottomBarProfileBtn", icon: _jsx(View, { style: styles.ctrlIconSizingWrapper, children: isAtMyProfile ? (_jsx(View, { style: [
                                        styles.ctrlIcon,
                                        pal.text,
                                        styles.profileIcon,
                                        styles.onProfile,
                                        {
                                            borderColor: pal.text.color,
                                            borderWidth: live ? 0 : 1,
                                        },
                                    ], children: _jsx(UserAvatar, { avatar: demoMode ? BOTTOM_BAR_AVI : profile === null || profile === void 0 ? void 0 : profile.avatar, size: iconWidth - 2, 
                                        // See https://github.com/bluesky-social/social-app/pull/1801:
                                        usePlainRNImage: true, type: ((_c = profile === null || profile === void 0 ? void 0 : profile.associated) === null || _c === void 0 ? void 0 : _c.labeler) ? 'labeler' : 'user', live: live, hideLiveBadge: true }) })) : (_jsx(View, { style: [
                                        styles.ctrlIcon,
                                        pal.text,
                                        styles.profileIcon,
                                        {
                                            borderWidth: live ? 0 : 1,
                                        },
                                    ], children: _jsx(UserAvatar, { avatar: demoMode ? BOTTOM_BAR_AVI : profile === null || profile === void 0 ? void 0 : profile.avatar, size: iconWidth - 2, 
                                        // See https://github.com/bluesky-social/social-app/pull/1801:
                                        usePlainRNImage: true, type: ((_d = profile === null || profile === void 0 ? void 0 : profile.associated) === null || _d === void 0 ? void 0 : _d.labeler) ? 'labeler' : 'user', live: live, hideLiveBadge: true }) })) }), onPress: onPressProfile, onLongPress: onLongPressProfile, accessibilityRole: "tab", accessibilityLabel: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Profile"], ["Profile"])))), accessibilityHint: "" })] })) : (_jsx(_Fragment, { children: _jsxs(View, { style: {
                            width: '100%',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingTop: 14,
                            paddingBottom: 2,
                            paddingLeft: 14,
                            paddingRight: 6,
                            gap: 8,
                        }, children: [_jsxs(View, { style: { flexDirection: 'row', alignItems: 'center', gap: 8 }, children: [_jsx(Logo, { width: 28 }), _jsx(View, { style: { paddingTop: 4 }, children: _jsx(Logotype, { width: 80, fill: pal.text.color }) })] }), _jsxs(View, { style: [a.flex_row, a.flex_wrap, a.gap_sm], children: [_jsx(Button, { onPress: showCreateAccount, label: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Create account"], ["Create account"])))), size: "small", variant: "solid", color: "primary", children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Create account" }) }) }), _jsx(Button, { onPress: showSignIn, label: _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Sign in"], ["Sign in"])))), size: "small", variant: "solid", color: "secondary", children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Sign in" }) }) })] })] }) })) })] }));
}
function Btn(_a) {
    var testID = _a.testID, icon = _a.icon, hasNew = _a.hasNew, notificationCount = _a.notificationCount, onPress = _a.onPress, onLongPress = _a.onLongPress, accessible = _a.accessible, accessibilityHint = _a.accessibilityHint, accessibilityLabel = _a.accessibilityLabel;
    var t = useTheme();
    return (_jsxs(PressableScale, { testID: testID, style: [styles.ctrl, a.flex_1], onPress: onPress, onLongPress: onLongPress, accessible: accessible, accessibilityLabel: accessibilityLabel, accessibilityHint: accessibilityHint, targetScale: 0.8, accessibilityLargeContentTitle: accessibilityLabel, accessibilityShowsLargeContentViewer: true, children: [icon, notificationCount ? (_jsx(View, { style: [
                    styles.notificationCount,
                    a.rounded_full,
                    { backgroundColor: t.palette.primary_500 },
                ], children: _jsx(Text, { style: styles.notificationCountLabel, children: notificationCount }) })) : hasNew ? (_jsx(View, { style: [styles.hasNewBadge, a.rounded_full] })) : null] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9;
