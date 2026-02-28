import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from 'react';
import { BackHandler, useWindowDimensions, View } from 'react-native';
import { Drawer } from 'react-native-drawer-layout';
import { SystemBars } from 'react-native-edge-to-edge';
import { Gesture } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { useDedupe } from '#/lib/hooks/useDedupe';
import { useIntentHandler } from '#/lib/hooks/useIntentHandler';
import { useNotificationsHandler } from '#/lib/hooks/useNotificationHandler';
import { useNotificationsRegistration } from '#/lib/notifications/notifications';
import { isStateAtTabRoot } from '#/lib/routes/helpers';
import { useDialogFullyExpandedCountContext } from '#/state/dialogs';
import { useSession } from '#/state/session';
import { useIsDrawerOpen, useIsDrawerSwipeDisabled, useSetDrawerOpen, } from '#/state/shell';
import { useCloseAnyActiveElement } from '#/state/util';
import { Lightbox } from '#/view/com/lightbox/Lightbox';
import { ModalsContainer } from '#/view/com/modals/Modal';
import { ErrorBoundary } from '#/view/com/util/ErrorBoundary';
import { Deactivated } from '#/screens/Deactivated';
import { Takendown } from '#/screens/Takendown';
import { atoms as a, select, useTheme } from '#/alf';
import { setSystemUITheme } from '#/alf/util/systemUI';
import { AgeAssuranceRedirectDialog } from '#/components/ageAssurance/AgeAssuranceRedirectDialog';
import { EmailDialog } from '#/components/dialogs/EmailDialog';
import { InAppBrowserConsentDialog } from '#/components/dialogs/InAppBrowserConsent';
import { LinkWarningDialog } from '#/components/dialogs/LinkWarning';
import { MutedWordsDialog } from '#/components/dialogs/MutedWords';
import { NuxDialogs } from '#/components/dialogs/nuxs';
import { SigninDialog } from '#/components/dialogs/Signin';
import { GlobalReportDialog } from '#/components/moderation/ReportDialog';
import { Outlet as PolicyUpdateOverlayPortalOutlet, usePolicyUpdateContext, } from '#/components/PolicyUpdateOverlay';
import { Outlet as PortalOutlet } from '#/components/Portal';
import { useAgeAssurance } from '#/ageAssurance';
import { NoAccessScreen } from '#/ageAssurance/components/NoAccessScreen';
import { RedirectOverlay } from '#/ageAssurance/components/RedirectOverlay';
import { PassiveAnalytics } from '#/analytics/PassiveAnalytics';
import { IS_ANDROID, IS_IOS, IS_LIQUID_GLASS } from '#/env';
import { RoutesContainer, TabsNavigator } from '#/Navigation';
import { BottomSheetOutlet } from '../../../modules/bottom-sheet';
import { updateActiveViewAsync } from '../../../modules/expo-bluesky-swiss-army/src/VisibilityView';
import { Composer } from './Composer';
import { DrawerContent } from './Drawer';
function ShellInner() {
    var winDim = useWindowDimensions();
    var insets = useSafeAreaInsets();
    var policyUpdateState = usePolicyUpdateContext().state;
    var closeAnyActiveElement = useCloseAnyActiveElement();
    useNotificationsRegistration();
    useNotificationsHandler();
    useEffect(function () {
        if (IS_ANDROID) {
            var listener_1 = BackHandler.addEventListener('hardwareBackPress', function () {
                return closeAnyActiveElement();
            });
            return function () {
                listener_1.remove();
            };
        }
    }, [closeAnyActiveElement]);
    // HACK
    // expo-video doesn't like it when you try and move a `player` to another `VideoView`. Instead, we need to actually
    // unregister that player to let the new screen register it. This is only a problem on Android, so we only need to
    // apply it there.
    // The `state` event should only fire whenever we push or pop to a screen, and should not fire consecutively quickly.
    // To be certain though, we will also dedupe these calls.
    var navigation = useNavigation();
    var dedupe = useDedupe(1000);
    useEffect(function () {
        if (!IS_ANDROID)
            return;
        var onFocusOrBlur = function () {
            setTimeout(function () {
                dedupe(updateActiveViewAsync);
            }, 500);
        };
        navigation.addListener('state', onFocusOrBlur);
        return function () {
            navigation.removeListener('state', onFocusOrBlur);
        };
    }, [dedupe, navigation]);
    var drawerLayout = useCallback(function (_a) {
        var children = _a.children;
        return (_jsx(DrawerLayout, { children: children }));
    }, []);
    return (_jsxs(_Fragment, { children: [_jsx(View, { style: [a.h_full], children: _jsx(ErrorBoundary, { style: { paddingTop: insets.top, paddingBottom: insets.bottom }, children: _jsx(TabsNavigator, { layout: drawerLayout }) }) }), _jsx(Composer, { winHeight: winDim.height }), _jsx(ModalsContainer, {}), _jsx(MutedWordsDialog, {}), _jsx(SigninDialog, {}), _jsx(EmailDialog, {}), _jsx(AgeAssuranceRedirectDialog, {}), _jsx(InAppBrowserConsentDialog, {}), _jsx(LinkWarningDialog, {}), _jsx(Lightbox, {}), _jsx(NuxDialogs, {}), _jsx(GlobalReportDialog, {}), policyUpdateState.completed && (_jsxs(_Fragment, { children: [_jsx(PortalOutlet, {}), _jsx(BottomSheetOutlet, {})] })), _jsx(PolicyUpdateOverlayPortalOutlet, {})] }));
}
function DrawerLayout(_a) {
    var children = _a.children;
    var t = useTheme();
    var isDrawerOpen = useIsDrawerOpen();
    var setIsDrawerOpen = useSetDrawerOpen();
    var isDrawerSwipeDisabled = useIsDrawerSwipeDisabled();
    var winDim = useWindowDimensions();
    var canGoBack = useNavigationState(function (state) { return !isStateAtTabRoot(state); });
    var hasSession = useSession().hasSession;
    var swipeEnabled = !canGoBack && hasSession && !isDrawerSwipeDisabled;
    var trendingScrollGesture = useState(function () { return Gesture.Native(); })[0];
    var renderDrawerContent = useCallback(function () { return _jsx(DrawerContent, {}); }, []);
    var onOpenDrawer = useCallback(function () { return setIsDrawerOpen(true); }, [setIsDrawerOpen]);
    var onCloseDrawer = useCallback(function () { return setIsDrawerOpen(false); }, [setIsDrawerOpen]);
    return (_jsx(Drawer, { renderDrawerContent: renderDrawerContent, drawerStyle: { width: Math.min(400, winDim.width * 0.8) }, configureGestureHandler: function (handler) {
            handler = handler.requireExternalGestureToFail(trendingScrollGesture);
            if (swipeEnabled) {
                if (isDrawerOpen) {
                    return handler.activeOffsetX([-1, 1]);
                }
                else {
                    return (handler
                        // Any movement to the left is a pager swipe
                        // so fail the drawer gesture immediately.
                        .failOffsetX(-1)
                        // Don't rush declaring that a movement to the right
                        // is a drawer swipe. It could be a vertical scroll.
                        .activeOffsetX(5));
                }
            }
            else {
                // Fail the gesture immediately.
                // This seems more reliable than the `swipeEnabled` prop.
                // With `swipeEnabled` alone, the gesture may freeze after toggling off/on.
                return handler.failOffsetX([0, 0]).failOffsetY([0, 0]);
            }
        }, open: isDrawerOpen, onOpen: onOpenDrawer, onClose: onCloseDrawer, swipeEdgeWidth: winDim.width, swipeMinVelocity: 100, swipeMinDistance: 10, drawerType: IS_IOS ? 'slide' : 'front', overlayStyle: {
            backgroundColor: select(t.name, {
                light: 'rgba(0, 57, 117, 0.1)',
                dark: IS_ANDROID
                    ? 'rgba(16, 133, 254, 0.1)'
                    : 'rgba(1, 82, 168, 0.1)',
                dim: 'rgba(10, 13, 16, 0.8)',
            }),
        }, children: children }));
}
export function Shell() {
    var t = useTheme();
    var aa = useAgeAssurance();
    var currentAccount = useSession().currentAccount;
    var fullyExpandedCount = useDialogFullyExpandedCountContext();
    useIntentHandler();
    useEffect(function () {
        setSystemUITheme('theme', t);
    }, [t]);
    return (_jsxs(View, { testID: "mobileShellView", style: [a.h_full, t.atoms.bg], children: [_jsx(SystemBars, { style: {
                    statusBar: t.name !== 'light' ||
                        (IS_IOS && !IS_LIQUID_GLASS && fullyExpandedCount > 0)
                        ? 'light'
                        : 'dark',
                    navigationBar: t.name !== 'light' ? 'light' : 'dark',
                } }), (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.status) === 'takendown' ? (_jsx(Takendown, {})) : (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.status) === 'deactivated' ? (_jsx(Deactivated, {})) : (_jsxs(_Fragment, { children: [aa.state.access === aa.Access.None ? (_jsx(NoAccessScreen, {})) : (_jsx(RoutesContainer, { children: _jsx(ShellInner, {}) })), _jsx(RedirectOverlay, {})] })), _jsx(PassiveAnalytics, {})] }));
}
