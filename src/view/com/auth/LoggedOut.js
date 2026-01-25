var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { PressableScale } from '#/lib/custom-animations/PressableScale';
import { useLoggedOutView, useLoggedOutViewControls, } from '#/state/shell/logged-out';
import { useSetMinimalShellMode } from '#/state/shell/minimal-mode';
import { ErrorBoundary } from '#/view/com/util/ErrorBoundary';
import { Login } from '#/screens/Login';
import { Signup } from '#/screens/Signup';
import { LandingScreen } from '#/screens/StarterPack/StarterPackLandingScreen';
import { atoms as a, native, tokens, useTheme } from '#/alf';
import { Button, ButtonIcon } from '#/components/Button';
import { TimesLarge_Stroke2_Corner0_Rounded as XIcon } from '#/components/icons/Times';
import { useAnalytics } from '#/analytics';
import { SplashScreen } from './SplashScreen';
var ScreenState;
(function (ScreenState) {
    ScreenState[ScreenState["S_LoginOrCreateAccount"] = 0] = "S_LoginOrCreateAccount";
    ScreenState[ScreenState["S_Login"] = 1] = "S_Login";
    ScreenState[ScreenState["S_CreateAccount"] = 2] = "S_CreateAccount";
    ScreenState[ScreenState["S_StarterPack"] = 3] = "S_StarterPack";
})(ScreenState || (ScreenState = {}));
export { ScreenState as LoggedOutScreenState };
export function LoggedOut(_a) {
    var onDismiss = _a.onDismiss;
    var _ = useLingui()._;
    var ax = useAnalytics();
    var t = useTheme();
    var insets = useSafeAreaInsets();
    var setMinimalShellMode = useSetMinimalShellMode();
    var requestedAccountSwitchTo = useLoggedOutView().requestedAccountSwitchTo;
    var _b = React.useState(function () {
        if (requestedAccountSwitchTo === 'new') {
            return ScreenState.S_CreateAccount;
        }
        else if (requestedAccountSwitchTo === 'starterpack') {
            return ScreenState.S_StarterPack;
        }
        else if (requestedAccountSwitchTo != null) {
            return ScreenState.S_Login;
        }
        else {
            return ScreenState.S_LoginOrCreateAccount;
        }
    }), screenState = _b[0], setScreenState = _b[1];
    var clearRequestedAccount = useLoggedOutViewControls().clearRequestedAccount;
    React.useEffect(function () {
        setMinimalShellMode(true);
    }, [setMinimalShellMode]);
    var onPressDismiss = React.useCallback(function () {
        if (onDismiss) {
            onDismiss();
        }
        clearRequestedAccount();
    }, [clearRequestedAccount, onDismiss]);
    return (_jsx(View, { testID: "noSessionView", style: [
            a.util_screen_outer,
            t.atoms.bg,
            { paddingTop: insets.top, paddingBottom: insets.bottom },
        ], children: _jsxs(ErrorBoundary, { children: [onDismiss && screenState === ScreenState.S_LoginOrCreateAccount ? (_jsx(Button, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Go back"], ["Go back"])))), variant: "solid", color: "secondary_inverted", size: "small", shape: "round", PressableComponent: native(PressableScale), style: [
                        a.absolute,
                        {
                            top: insets.top + tokens.space.xl,
                            right: tokens.space.xl,
                            zIndex: 100,
                        },
                    ], onPress: onPressDismiss, children: _jsx(ButtonIcon, { icon: XIcon }) })) : null, screenState === ScreenState.S_StarterPack ? (_jsx(LandingScreen, { setScreenState: setScreenState })) : screenState === ScreenState.S_LoginOrCreateAccount ? (_jsx(SplashScreen, { onPressSignin: function () {
                        setScreenState(ScreenState.S_Login);
                        ax.metric('splash:signInPressed', {});
                    }, onPressCreateAccount: function () {
                        setScreenState(ScreenState.S_CreateAccount);
                        ax.metric('splash:createAccountPressed', {});
                    } })) : undefined, screenState === ScreenState.S_Login ? (_jsx(Login, { onPressBack: function () {
                        setScreenState(ScreenState.S_LoginOrCreateAccount);
                        clearRequestedAccount();
                    } })) : undefined, screenState === ScreenState.S_CreateAccount ? (_jsx(Signup, { onPressBack: function () {
                        return setScreenState(ScreenState.S_LoginOrCreateAccount);
                    } })) : undefined] }) }));
}
var templateObject_1;
