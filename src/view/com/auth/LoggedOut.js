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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { useQueryClient } from '@tanstack/react-query';
import { PressableScale } from '#/lib/custom-animations/PressableScale';
import { STALE } from '#/state/queries';
import { profilesQueryKey } from '#/state/queries/profile';
import { useAgent, useSession } from '#/state/session';
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
    var _this = this;
    var onDismiss = _a.onDismiss;
    var _ = useLingui()._;
    var ax = useAnalytics();
    var t = useTheme();
    var insets = useSafeAreaInsets();
    var setMinimalShellMode = useSetMinimalShellMode();
    var requestedAccountSwitchTo = useLoggedOutView().requestedAccountSwitchTo;
    var _b = useState(function () {
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
    var queryClient = useQueryClient();
    var accounts = useSession().accounts;
    var agent = useAgent();
    useEffect(function () {
        var actors = accounts.map(function (acc) { return acc.did; });
        void queryClient.prefetchQuery({
            queryKey: profilesQueryKey(actors),
            staleTime: STALE.MINUTES.FIVE,
            queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
                var res;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, agent.getProfiles({ actors: actors })];
                        case 1:
                            res = _a.sent();
                            return [2 /*return*/, res.data];
                    }
                });
            }); },
        });
    }, [accounts, agent, queryClient]);
    useEffect(function () {
        setMinimalShellMode(true);
    }, [setMinimalShellMode]);
    var onPressDismiss = useCallback(function () {
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
