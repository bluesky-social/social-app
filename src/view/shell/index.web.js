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
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useNavigation } from '@react-navigation/native';
import { RemoveScrollBar } from 'react-remove-scroll-bar';
import { useIntentHandler } from '#/lib/hooks/useIntentHandler';
import { useSession } from '#/state/session';
import { useIsDrawerOpen, useSetDrawerOpen } from '#/state/shell';
import { useComposerKeyboardShortcut } from '#/state/shell/composer/useComposerKeyboardShortcut';
import { useCloseAllActiveElements } from '#/state/util';
import { Lightbox } from '#/view/com/lightbox/Lightbox';
import { ModalsContainer } from '#/view/com/modals/Modal';
import { ErrorBoundary } from '#/view/com/util/ErrorBoundary';
import { Deactivated } from '#/screens/Deactivated';
import { Takendown } from '#/screens/Takendown';
import { atoms as a, select, useBreakpoints, useTheme } from '#/alf';
import { AgeAssuranceRedirectDialog } from '#/components/ageAssurance/AgeAssuranceRedirectDialog';
import { EmailDialog } from '#/components/dialogs/EmailDialog';
import { LinkWarningDialog } from '#/components/dialogs/LinkWarning';
import { MutedWordsDialog } from '#/components/dialogs/MutedWords';
import { NuxDialogs } from '#/components/dialogs/nuxs';
import { SigninDialog } from '#/components/dialogs/Signin';
import { useWelcomeModal } from '#/components/hooks/useWelcomeModal';
import { GlobalReportDialog } from '#/components/moderation/ReportDialog';
import { Outlet as PolicyUpdateOverlayPortalOutlet, usePolicyUpdateContext, } from '#/components/PolicyUpdateOverlay';
import { Outlet as PortalOutlet } from '#/components/Portal';
import { WelcomeModal } from '#/components/WelcomeModal';
import { useAgeAssurance } from '#/ageAssurance';
import { NoAccessScreen } from '#/ageAssurance/components/NoAccessScreen';
import { RedirectOverlay } from '#/ageAssurance/components/RedirectOverlay';
import { PassiveAnalytics } from '#/analytics/PassiveAnalytics';
import { FlatNavigator, RoutesContainer } from '#/Navigation';
import { Composer } from './Composer.web';
import { DrawerContent } from './Drawer';
function ShellInner() {
    var navigator = useNavigation();
    var closeAllActiveElements = useCloseAllActiveElements();
    var policyUpdateState = usePolicyUpdateContext().state;
    var welcomeModalControl = useWelcomeModal();
    useComposerKeyboardShortcut();
    useIntentHandler();
    useEffect(function () {
        var unsubscribe = navigator.addListener('state', function () {
            closeAllActiveElements();
        });
        return unsubscribe;
    }, [navigator, closeAllActiveElements]);
    var drawerLayout = useCallback(function (_a) {
        var children = _a.children;
        return (_jsx(DrawerLayout, { children: children }));
    }, []);
    return (_jsxs(_Fragment, { children: [_jsx(ErrorBoundary, { children: _jsx(FlatNavigator, { layout: drawerLayout }) }), _jsx(Composer, { winHeight: 0 }), _jsx(ModalsContainer, {}), _jsx(MutedWordsDialog, {}), _jsx(SigninDialog, {}), _jsx(EmailDialog, {}), _jsx(AgeAssuranceRedirectDialog, {}), _jsx(LinkWarningDialog, {}), _jsx(Lightbox, {}), _jsx(NuxDialogs, {}), _jsx(GlobalReportDialog, {}), welcomeModalControl.isOpen && (_jsx(WelcomeModal, { control: welcomeModalControl })), policyUpdateState.completed && (_jsx(_Fragment, { children: _jsx(PortalOutlet, {}) })), _jsx(PolicyUpdateOverlayPortalOutlet, {})] }));
}
function DrawerLayout(_a) {
    var children = _a.children;
    var t = useTheme();
    var isDrawerOpen = useIsDrawerOpen();
    var setDrawerOpen = useSetDrawerOpen();
    var gtTablet = useBreakpoints().gtTablet;
    var _ = useLingui()._;
    var showDrawer = !gtTablet && isDrawerOpen;
    var _b = useState(showDrawer), showDrawerDelayedExit = _b[0], setShowDrawerDelayedExit = _b[1];
    useLayoutEffect(function () {
        if (showDrawer !== showDrawerDelayedExit) {
            if (showDrawer) {
                setShowDrawerDelayedExit(true);
            }
            else {
                var timeout_1 = setTimeout(function () {
                    setShowDrawerDelayedExit(false);
                }, 160);
                return function () { return clearTimeout(timeout_1); };
            }
        }
    }, [showDrawer, showDrawerDelayedExit]);
    return (_jsxs(_Fragment, { children: [children, showDrawerDelayedExit && (_jsxs(_Fragment, { children: [_jsx(RemoveScrollBar, {}), _jsx(TouchableWithoutFeedback, { onPress: function (ev) {
                            // Only close if press happens outside of the drawer
                            if (ev.target === ev.currentTarget) {
                                setDrawerOpen(false);
                            }
                        }, accessibilityLabel: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Close drawer menu"], ["Close drawer menu"])))), accessibilityHint: "", children: _jsx(View, { style: [
                                styles.drawerMask,
                                {
                                    backgroundColor: showDrawer
                                        ? select(t.name, {
                                            light: 'rgba(0, 57, 117, 0.1)',
                                            dark: 'rgba(1, 82, 168, 0.1)',
                                            dim: 'rgba(10, 13, 16, 0.8)',
                                        })
                                        : 'transparent',
                                },
                                a.transition_color,
                            ], children: _jsx(View, { style: [
                                    styles.drawerContainer,
                                    showDrawer ? a.slide_in_left : a.slide_out_left,
                                ], children: _jsx(DrawerContent, {}) }) }) })] }))] }));
}
export function Shell() {
    var t = useTheme();
    var aa = useAgeAssurance();
    var currentAccount = useSession().currentAccount;
    return (_jsxs(View, { style: [a.util_screen_outer, t.atoms.bg], children: [(currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.status) === 'takendown' ? (_jsx(Takendown, {})) : (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.status) === 'deactivated' ? (_jsx(Deactivated, {})) : (_jsxs(_Fragment, { children: [aa.state.access === aa.Access.None ? (_jsx(NoAccessScreen, {})) : (_jsx(RoutesContainer, { children: _jsx(ShellInner, {}) })), _jsx(RedirectOverlay, {})] })), _jsx(PassiveAnalytics, {})] }));
}
var styles = StyleSheet.create({
    drawerMask: __assign(__assign({}, a.fixed), { width: '100%', height: '100%', top: 0, left: 0 }),
    drawerContainer: __assign(__assign({ display: 'flex' }, a.fixed), { top: 0, left: 0, height: '100%', width: 330, maxWidth: '80%' }),
});
var templateObject_1;
