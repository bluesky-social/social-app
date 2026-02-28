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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { View } from 'react-native';
// Based on @react-navigation/native-stack/src/navigators/createNativeStackNavigator.ts
// MIT License
// Copyright (c) 2017 React Navigation Contributors
import { createNavigatorFactory, StackActions, StackRouter, useNavigationBuilder, } from '@react-navigation/native';
import { NativeStackView } from '@react-navigation/native-stack';
import { useWebMediaQueries } from '#/lib/hooks/useWebMediaQueries';
import { useSession } from '#/state/session';
import { useOnboardingState } from '#/state/shell';
import { useLoggedOutView, useLoggedOutViewControls, } from '#/state/shell/logged-out';
import { LoggedOut } from '#/view/com/auth/LoggedOut';
import { Onboarding } from '#/screens/Onboarding';
import { SignupQueued } from '#/screens/SignupQueued';
import { atoms as a, useLayoutBreakpoints } from '#/alf';
import { PolicyUpdateOverlay } from '#/components/PolicyUpdateOverlay';
import { IS_NATIVE, IS_WEB } from '#/env';
import { BottomBarWeb } from './bottom-bar/BottomBarWeb';
import { DesktopLeftNav } from './desktop/LeftNav';
import { DesktopRightNav } from './desktop/RightNav';
function NativeStackNavigator(_a) {
    var _b, _c;
    var id = _a.id, initialRouteName = _a.initialRouteName, UNSTABLE_routeNamesChangeBehavior = _a.UNSTABLE_routeNamesChangeBehavior, children = _a.children, layout = _a.layout, screenListeners = _a.screenListeners, screenOptions = _a.screenOptions, screenLayout = _a.screenLayout, UNSTABLE_router = _a.UNSTABLE_router, rest = __rest(_a, ["id", "initialRouteName", "UNSTABLE_routeNamesChangeBehavior", "children", "layout", "screenListeners", "screenOptions", "screenLayout", "UNSTABLE_router"]);
    // --- this is copy and pasted from the original native stack navigator ---
    var _d = useNavigationBuilder(StackRouter, {
        id: id,
        initialRouteName: initialRouteName,
        UNSTABLE_routeNamesChangeBehavior: UNSTABLE_routeNamesChangeBehavior,
        children: children,
        layout: layout,
        screenListeners: screenListeners,
        screenOptions: screenOptions,
        screenLayout: screenLayout,
        UNSTABLE_router: UNSTABLE_router,
    }), state = _d.state, describe = _d.describe, descriptors = _d.descriptors, navigation = _d.navigation, NavigationContent = _d.NavigationContent;
    React.useEffect(function () {
        var _a;
        // @ts-expect-error: there may not be a tab navigator in parent
        return (_a = navigation === null || navigation === void 0 ? void 0 : navigation.addListener) === null || _a === void 0 ? void 0 : _a.call(navigation, 'tabPress', function (e) {
            var isFocused = navigation.isFocused();
            // Run the operation in the next frame so we're sure all listeners have been run
            // This is necessary to know if preventDefault() has been called
            requestAnimationFrame(function () {
                if (state.index > 0 &&
                    isFocused &&
                    !e.defaultPrevented) {
                    // When user taps on already focused tab and we're inside the tab,
                    // reset the stack to replicate native behaviour
                    navigation.dispatch(__assign(__assign({}, StackActions.popToTop()), { target: state.key }));
                }
            });
        });
    }, [navigation, state.index, state.key]);
    // --- our custom logic starts here ---
    var _e = useSession(), hasSession = _e.hasSession, currentAccount = _e.currentAccount;
    var activeRoute = state.routes[state.index];
    var activeDescriptor = descriptors[activeRoute.key];
    var activeRouteRequiresAuth = (_b = activeDescriptor.options.requireAuth) !== null && _b !== void 0 ? _b : false;
    var onboardingState = useOnboardingState();
    var showLoggedOut = useLoggedOutView().showLoggedOut;
    var setShowLoggedOut = useLoggedOutViewControls().setShowLoggedOut;
    var isMobile = useWebMediaQueries().isMobile;
    var leftNavMinimal = useLayoutBreakpoints().leftNavMinimal;
    if (!hasSession && (activeRouteRequiresAuth || IS_NATIVE)) {
        return _jsx(LoggedOut, {});
    }
    if (hasSession && (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.signupQueued)) {
        return _jsx(SignupQueued, {});
    }
    if (showLoggedOut) {
        return _jsx(LoggedOut, { onDismiss: function () { return setShowLoggedOut(false); } });
    }
    if (onboardingState.isActive) {
        return _jsx(Onboarding, {});
    }
    var newDescriptors = {};
    var _loop_1 = function (key) {
        var descriptor = descriptors[key];
        var requireAuth = (_c = descriptor.options.requireAuth) !== null && _c !== void 0 ? _c : false;
        newDescriptors[key] = __assign(__assign({}, descriptor), { render: function () {
                if (requireAuth && !hasSession) {
                    return _jsx(View, {});
                }
                else {
                    return descriptor.render();
                }
            } });
    };
    for (var key in descriptors) {
        _loop_1(key);
    }
    // Show the bottom bar if we have a session only on mobile web. If we don't have a session, we want to show it
    // on both tablet and mobile web so that we see the create account CTA.
    var showBottomBar = hasSession ? isMobile : leftNavMinimal;
    return (_jsxs(NavigationContent, { children: [_jsx(View, { role: "main", style: a.flex_1, children: _jsx(NativeStackView, __assign({}, rest, { state: state, navigation: navigation, descriptors: descriptors, describe: describe })) }), IS_WEB && (_jsxs(_Fragment, { children: [showBottomBar ? _jsx(BottomBarWeb, {}) : _jsx(DesktopLeftNav, {}), !isMobile && _jsx(DesktopRightNav, { routeName: activeRoute.name })] })), hasSession && _jsx(PolicyUpdateOverlay, {})] }));
}
export function createNativeStackNavigatorWithAuth(config) {
    return createNavigatorFactory(NativeStackNavigator)(config);
}
