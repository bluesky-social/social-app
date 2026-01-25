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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useQueryClient } from '@tanstack/react-query';
import { useAccountSwitcher } from '#/lib/hooks/useAccountSwitcher';
import { logger } from '#/logger';
import { useAgent, useSession, useSessionApi, } from '#/state/session';
import { useLoggedOutViewControls } from '#/state/shell/logged-out';
import { Logo } from '#/view/icons/Logo';
import { atoms as a, useTheme } from '#/alf';
import { AccountList } from '#/components/AccountList';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { Divider } from '#/components/Divider';
import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfo } from '#/components/icons/CircleInfo';
import * as Layout from '#/components/Layout';
import { Loader } from '#/components/Loader';
import { Text } from '#/components/Typography';
import { IS_WEB } from '#/env';
var COL_WIDTH = 400;
export function Deactivated() {
    var _this = this;
    var _ = useLingui()._;
    var t = useTheme();
    var insets = useSafeAreaInsets();
    var _a = useSession(), currentAccount = _a.currentAccount, accounts = _a.accounts;
    var _b = useAccountSwitcher(), onPressSwitchAccount = _b.onPressSwitchAccount, pendingDid = _b.pendingDid;
    var setShowLoggedOut = useLoggedOutViewControls().setShowLoggedOut;
    var hasOtherAccounts = accounts.length > 1;
    var logoutCurrentAccount = useSessionApi().logoutCurrentAccount;
    var agent = useAgent();
    var _c = React.useState(false), pending = _c[0], setPending = _c[1];
    var _d = React.useState(), error = _d[0], setError = _d[1];
    var queryClient = useQueryClient();
    var onSelectAccount = React.useCallback(function (account) {
        if (account.did !== (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did)) {
            onPressSwitchAccount(account, 'SwitchAccount');
        }
    }, [currentAccount, onPressSwitchAccount]);
    var onPressAddAccount = React.useCallback(function () {
        setShowLoggedOut(true);
    }, [setShowLoggedOut]);
    var onPressLogout = React.useCallback(function () {
        if (IS_WEB) {
            // We're switching accounts, which remounts the entire app.
            // On mobile, this gets us Home, but on the web we also need reset the URL.
            // We can't change the URL via a navigate() call because the navigator
            // itself is about to unmount, and it calls pushState() too late.
            // So we change the URL ourselves. The navigator will pick it up on remount.
            history.pushState(null, '', '/');
        }
        logoutCurrentAccount('Deactivated');
    }, [logoutCurrentAccount]);
    var handleActivate = React.useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, 5, 6]);
                    setPending(true);
                    return [4 /*yield*/, agent.com.atproto.server.activateAccount()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, queryClient.resetQueries()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, agent.resumeSession(agent.session)];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 6];
                case 4:
                    e_1 = _a.sent();
                    switch (e_1.message) {
                        case 'Bad token scope':
                            setError(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["You're signed in with an App Password. Please sign in with your main password to continue deactivating your account."], ["You're signed in with an App Password. Please sign in with your main password to continue deactivating your account."])))));
                            break;
                        default:
                            setError(_(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Something went wrong, please try again"], ["Something went wrong, please try again"])))));
                            break;
                    }
                    logger.error(e_1, {
                        message: 'Failed to activate account',
                    });
                    return [3 /*break*/, 6];
                case 5:
                    setPending(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); }, [_, agent, setPending, setError, queryClient]);
    return (_jsx(View, { style: [a.util_screen_outer, a.flex_1], children: _jsx(Layout.Content, { ignoreTabletLayoutOffset: true, contentContainerStyle: [
                a.px_2xl,
                {
                    paddingTop: IS_WEB ? 64 : insets.top + 16,
                    paddingBottom: IS_WEB ? 64 : insets.bottom,
                },
            ], children: _jsxs(View, { style: [a.w_full, { marginHorizontal: 'auto', maxWidth: COL_WIDTH }], children: [_jsx(View, { style: [a.w_full, a.justify_center, a.align_center, a.pb_5xl], children: _jsx(Logo, { width: 40 }) }), _jsxs(View, { style: [a.gap_xs, a.pb_3xl], children: [_jsx(Text, { style: [a.text_xl, a.font_semi_bold, a.leading_snug], children: _jsx(Trans, { children: "Welcome back!" }) }), _jsx(Text, { style: [a.text_sm, a.leading_snug], children: _jsxs(Trans, { children: ["You previously deactivated @", currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.handle, "."] }) }), _jsx(Text, { style: [a.text_sm, a.leading_snug, a.pb_md], children: _jsx(Trans, { children: "You can reactivate your account to continue logging in. Your profile and posts will be visible to other users." }) }), _jsxs(View, { style: [a.gap_sm], children: [_jsxs(Button, { label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Reactivate your account"], ["Reactivate your account"])))), size: "large", variant: "solid", color: "primary", onPress: handleActivate, children: [_jsx(ButtonText, { children: _jsx(Trans, { children: "Yes, reactivate my account" }) }), pending && _jsx(ButtonIcon, { icon: Loader, position: "right" })] }), _jsx(Button, { label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Cancel reactivation and sign out"], ["Cancel reactivation and sign out"])))), size: "large", variant: "solid", color: "secondary", onPress: onPressLogout, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Cancel" }) }) })] }), error && (_jsxs(View, { style: [
                                    a.flex_row,
                                    a.gap_sm,
                                    a.mt_md,
                                    a.p_md,
                                    a.rounded_sm,
                                    t.atoms.bg_contrast_25,
                                ], children: [_jsx(CircleInfo, { size: "md", fill: t.palette.negative_400 }), _jsx(Text, { style: [a.flex_1, a.leading_snug], children: error })] }))] }), _jsx(View, { style: [a.pb_3xl], children: _jsx(Divider, {}) }), hasOtherAccounts ? (_jsxs(_Fragment, { children: [_jsx(Text, { style: [t.atoms.text_contrast_medium, a.pb_md, a.leading_snug], children: _jsx(Trans, { children: "Or, sign in to one of your other accounts." }) }), _jsx(AccountList, { onSelectAccount: onSelectAccount, onSelectOther: onPressAddAccount, otherLabel: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Add account"], ["Add account"])))), pendingDid: pendingDid })] })) : (_jsxs(_Fragment, { children: [_jsx(Text, { style: [t.atoms.text_contrast_medium, a.pb_md, a.leading_snug], children: _jsx(Trans, { children: "Or, continue with another account." }) }), _jsx(Button, { label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Sign in or create an account"], ["Sign in or create an account"])))), size: "large", variant: "solid", color: "secondary", onPress: function () { return setShowLoggedOut(true); }, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Sign in or create an account" }) }) })] }))] }) }) }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6;
