var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { msg, plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useNavigationState } from '@react-navigation/native';
import { useHideBottomBarBorder } from '#/lib/hooks/useHideBottomBarBorder';
import { useMinimalShellFooterTransform } from '#/lib/hooks/useMinimalShellTransform';
import { getCurrentRoute, isTab } from '#/lib/routes/helpers';
import { makeProfileLink } from '#/lib/routes/links';
import { useUnreadMessageCount } from '#/state/queries/messages/list-conversations';
import { useUnreadNotifications } from '#/state/queries/notifications/unread';
import { useProfileQuery } from '#/state/queries/profile';
import { useSession } from '#/state/session';
import { useLoggedOutViewControls } from '#/state/shell/logged-out';
import { useShellLayout } from '#/state/shell/shell-layout';
import { useCloseAllActiveElements } from '#/state/util';
import { Link } from '#/view/com/util/Link';
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
import { styles } from './BottomBarStyles';
export function BottomBarWeb() {
    var _ = useLingui()._;
    var _a = useSession(), hasSession = _a.hasSession, currentAccount = _a.currentAccount;
    var t = useTheme();
    var footerMinimalShellTransform = useMinimalShellFooterTransform();
    var requestSwitchToAccount = useLoggedOutViewControls().requestSwitchToAccount;
    var closeAllActiveElements = useCloseAllActiveElements();
    var footerHeight = useShellLayout().footerHeight;
    var hideBorder = useHideBottomBarBorder();
    var accountSwitchControl = useDialogControl();
    var profile = useProfileQuery({ did: currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did }).data;
    var iconWidth = 26;
    var unreadMessageCount = useUnreadMessageCount();
    var notificationCountStr = useUnreadNotifications();
    var showSignIn = React.useCallback(function () {
        closeAllActiveElements();
        requestSwitchToAccount({ requestedAccount: 'none' });
    }, [requestSwitchToAccount, closeAllActiveElements]);
    var showCreateAccount = React.useCallback(function () {
        closeAllActiveElements();
        requestSwitchToAccount({ requestedAccount: 'new' });
        // setShowLoggedOut(true)
    }, [requestSwitchToAccount, closeAllActiveElements]);
    var onLongPressProfile = React.useCallback(function () {
        accountSwitchControl.open();
    }, [accountSwitchControl]);
    return (_jsxs(_Fragment, { children: [_jsx(SwitchAccountDialog, { control: accountSwitchControl }), _jsx(Animated.View, { role: "navigation", style: [
                    styles.bottomBar,
                    styles.bottomBarWeb,
                    t.atoms.bg,
                    hideBorder
                        ? { borderColor: t.atoms.bg.backgroundColor }
                        : t.atoms.border_contrast_low,
                    footerMinimalShellTransform,
                ], onLayout: function (event) { return footerHeight.set(event.nativeEvent.layout.height); }, children: hasSession ? (_jsxs(_Fragment, { children: [_jsx(NavItem, { routeName: "Home", href: "/", children: function (_a) {
                                var isActive = _a.isActive;
                                var Icon = isActive ? HomeFilled : Home;
                                return (_jsx(Icon, { "aria-hidden": true, width: iconWidth + 1, style: [styles.ctrlIcon, t.atoms.text, styles.homeIcon] }));
                            } }), _jsx(NavItem, { routeName: "Search", href: "/search", children: function (_a) {
                                var isActive = _a.isActive;
                                var Icon = isActive ? MagnifyingGlassFilled : MagnifyingGlass;
                                return (_jsx(Icon, { "aria-hidden": true, width: iconWidth + 2, style: [styles.ctrlIcon, t.atoms.text, styles.searchIcon] }));
                            } }), hasSession && (_jsxs(_Fragment, { children: [_jsx(NavItem, { routeName: "Messages", href: "/messages", notificationCount: unreadMessageCount.numUnread, hasNew: unreadMessageCount.hasNew, children: function (_a) {
                                        var isActive = _a.isActive;
                                        var Icon = isActive ? MessageFilled : Message;
                                        return (_jsx(Icon, { "aria-hidden": true, width: iconWidth - 1, style: [
                                                styles.ctrlIcon,
                                                t.atoms.text,
                                                styles.messagesIcon,
                                            ] }));
                                    } }), _jsx(NavItem, { routeName: "Notifications", href: "/notifications", notificationCount: notificationCountStr, children: function (_a) {
                                        var isActive = _a.isActive;
                                        var Icon = isActive ? BellFilled : Bell;
                                        return (_jsx(Icon, { "aria-hidden": true, width: iconWidth, style: [styles.ctrlIcon, t.atoms.text, styles.bellIcon] }));
                                    } }), _jsx(NavItem, { routeName: "Profile", href: currentAccount
                                        ? makeProfileLink({
                                            did: currentAccount.did,
                                            handle: currentAccount.handle,
                                        })
                                        : '/', onLongPress: onLongPressProfile, children: function (_a) {
                                        var _b;
                                        var isActive = _a.isActive;
                                        return (_jsx(View, { style: styles.ctrlIconSizingWrapper, children: _jsx(View, { style: [
                                                    styles.ctrlIcon,
                                                    styles.profileIcon,
                                                    isActive && [
                                                        styles.onProfile,
                                                        { borderColor: t.atoms.text.color },
                                                    ],
                                                ], children: _jsx(UserAvatar, { avatar: profile === null || profile === void 0 ? void 0 : profile.avatar, size: iconWidth - 3, type: ((_b = profile === null || profile === void 0 ? void 0 : profile.associated) === null || _b === void 0 ? void 0 : _b.labeler) ? 'labeler' : 'user' }) }) }));
                                    } })] }))] })) : (_jsx(_Fragment, { children: _jsxs(View, { style: [
                            a.w_full,
                            a.flex_row,
                            a.align_center,
                            a.justify_between,
                            a.gap_sm,
                            {
                                paddingTop: 14,
                                paddingBottom: 14,
                                paddingLeft: 14,
                                paddingRight: 6,
                            },
                        ], children: [_jsxs(View, { style: [a.flex_row, a.align_center, a.gap_md], children: [_jsx(Logo, { width: 32 }), _jsx(View, { style: { paddingTop: 4 }, children: _jsx(Logotype, { width: 80, fill: t.atoms.text.color }) })] }), _jsxs(View, { style: [a.flex_row, a.flex_wrap, a.gap_sm], children: [_jsx(Button, { onPress: showCreateAccount, label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Create account"], ["Create account"])))), size: "small", variant: "solid", color: "primary", children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Create account" }) }) }), _jsx(Button, { onPress: showSignIn, label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Sign in"], ["Sign in"])))), size: "small", variant: "solid", color: "secondary", children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Sign in" }) }) })] })] }) })) })] }));
}
var NavItem = function (_a) {
    var children = _a.children, href = _a.href, routeName = _a.routeName, hasNew = _a.hasNew, notificationCount = _a.notificationCount, onLongPress = _a.onLongPress;
    var t = useTheme();
    var _ = useLingui()._;
    var currentAccount = useSession().currentAccount;
    var currentRoute = useNavigationState(function (state) {
        if (!state) {
            return { name: 'Home' };
        }
        return getCurrentRoute(state);
    });
    // Checks whether we're on someone else's profile
    var isOnDifferentProfile = currentRoute.name === 'Profile' &&
        routeName === 'Profile' &&
        currentRoute.params.name !==
            (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.handle);
    var isActive = currentRoute.name === 'Profile'
        ? isTab(currentRoute.name, routeName) &&
            currentRoute.params.name ===
                (routeName === 'Profile'
                    ? currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.handle
                    : currentRoute.params.name)
        : isTab(currentRoute.name, routeName);
    return (_jsxs(Link, { href: href, style: [styles.ctrl, a.pb_lg], navigationAction: isOnDifferentProfile ? 'push' : 'navigate', "aria-role": "link", "aria-label": routeName, accessible: true, onLongPress: onLongPress, children: [children({ isActive: isActive }), notificationCount ? (_jsx(View, { style: [
                    styles.notificationCount,
                    styles.notificationCountWeb,
                    { backgroundColor: t.palette.primary_500 },
                ], "aria-label": _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["", ""], ["", ""])), plural(notificationCount, {
                    one: '# unread item',
                    other: '# unread items',
                }))), children: _jsx(Text, { style: styles.notificationCountLabel, children: notificationCount }) })) : hasNew ? (_jsx(View, { style: styles.hasNewBadge })) : null] }));
};
var templateObject_1, templateObject_2, templateObject_3;
