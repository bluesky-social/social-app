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
import React from 'react';
import { Modal, ScrollView, View } from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { msg, plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { logger } from '#/logger';
import { isSignupQueued, useAgent, useSessionApi } from '#/state/session';
import { useOnboardingDispatch } from '#/state/shell';
import { Logo } from '#/view/icons/Logo';
import { atoms as a, native, useBreakpoints, useTheme, web } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { Loader } from '#/components/Loader';
import { P, Text } from '#/components/Typography';
import { IS_IOS, IS_LIQUID_GLASS, IS_WEB } from '#/env';
var COL_WIDTH = 400;
export function SignupQueued() {
    var _this = this;
    var _ = useLingui()._;
    var t = useTheme();
    var insets = useSafeAreaInsets();
    var gtMobile = useBreakpoints().gtMobile;
    var onboardingDispatch = useOnboardingDispatch();
    var logoutCurrentAccount = useSessionApi().logoutCurrentAccount;
    var agent = useAgent();
    var _a = React.useState(false), isProcessing = _a[0], setProcessing = _a[1];
    var _b = React.useState(undefined), estimatedTime = _b[0], setEstimatedTime = _b[1];
    var _c = React.useState(undefined), placeInQueue = _c[0], setPlaceInQueue = _c[1];
    var checkStatus = React.useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var res, e_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    setProcessing(true);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 6, 7, 8]);
                    return [4 /*yield*/, agent.com.atproto.temp.checkSignupQueue()];
                case 2:
                    res = _b.sent();
                    if (!res.data.activated) return [3 /*break*/, 4];
                    // ready to go, exchange the access token for a usable one and kick off onboarding
                    return [4 /*yield*/, agent.sessionManager.refreshSession()];
                case 3:
                    // ready to go, exchange the access token for a usable one and kick off onboarding
                    _b.sent();
                    if (!isSignupQueued((_a = agent.session) === null || _a === void 0 ? void 0 : _a.accessJwt)) {
                        onboardingDispatch({ type: 'start' });
                    }
                    return [3 /*break*/, 5];
                case 4:
                    // not ready, update UI
                    setEstimatedTime(msToString(res.data.estimatedTimeMs));
                    if (typeof res.data.placeInQueue !== 'undefined') {
                        setPlaceInQueue(Math.max(res.data.placeInQueue, 1));
                    }
                    _b.label = 5;
                case 5: return [3 /*break*/, 8];
                case 6:
                    e_1 = _b.sent();
                    logger.error('Failed to check signup queue', { err: e_1.toString() });
                    return [3 /*break*/, 8];
                case 7:
                    setProcessing(false);
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    }); }, [
        setProcessing,
        setEstimatedTime,
        setPlaceInQueue,
        onboardingDispatch,
        agent,
    ]);
    React.useEffect(function () {
        checkStatus();
        var interval = setInterval(checkStatus, 60e3);
        return function () { return clearInterval(interval); };
    }, [checkStatus]);
    var checkBtn = (_jsxs(Button, { variant: "solid", color: "primary", size: "large", label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Check my status"], ["Check my status"])))), onPress: checkStatus, disabled: isProcessing, children: [_jsx(ButtonText, { children: _jsx(Trans, { children: "Check my status" }) }), isProcessing && _jsx(ButtonIcon, { icon: Loader })] }));
    var logoutBtn = (_jsx(Button, { variant: "ghost", size: "large", color: "primary", label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Sign out"], ["Sign out"])))), onPress: function () { return logoutCurrentAccount('SignupQueued'); }, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Sign out" }) }) }));
    var webLayout = IS_WEB && gtMobile;
    return (_jsxs(Modal, { visible: true, animationType: native('slide'), presentationStyle: "formSheet", style: [web(a.util_screen_outer)], children: [IS_IOS && !IS_LIQUID_GLASS && (_jsx(SystemBars, { style: { statusBar: 'light' } })), _jsx(ScrollView, { style: [a.flex_1, t.atoms.bg], contentContainerStyle: { borderWidth: 0 }, bounces: false, children: _jsx(View, { style: [
                        a.flex_row,
                        a.justify_center,
                        gtMobile ? a.pt_4xl : [a.px_xl, a.pt_xl],
                    ], children: _jsxs(View, { style: [a.flex_1, { maxWidth: COL_WIDTH }], children: [_jsx(View, { style: [a.w_full, a.justify_center, a.align_center, a.my_4xl], children: _jsx(Logo, { width: 120 }) }), _jsx(Text, { style: [a.text_4xl, a.font_bold, a.pb_sm], children: _jsx(Trans, { children: "You're in line" }) }), _jsx(P, { style: [t.atoms.text_contrast_medium], children: _jsx(Trans, { children: "There's been a rush of new users to Bluesky! We'll activate your account as soon as we can." }) }), _jsxs(View, { style: [
                                    a.rounded_sm,
                                    a.px_2xl,
                                    a.py_4xl,
                                    a.mt_2xl,
                                    a.mb_md,
                                    a.border,
                                    t.atoms.bg_contrast_25,
                                    t.atoms.border_contrast_medium,
                                ], children: [typeof placeInQueue === 'number' && (_jsx(Text, { style: [a.text_5xl, a.text_center, a.font_bold, a.mb_2xl], children: placeInQueue })), _jsxs(P, { style: [a.text_center], children: [typeof placeInQueue === 'number' ? (_jsx(Trans, { children: "left to go." })) : (_jsx(Trans, { children: "You are in line." })), ' ', estimatedTime ? (_jsxs(Trans, { children: ["We estimate ", estimatedTime, " until your account is ready."] })) : (_jsx(Trans, { children: "We will let you know when your account is ready." }))] })] }), webLayout && (_jsxs(View, { style: [
                                    a.w_full,
                                    a.flex_row,
                                    a.justify_between,
                                    a.pt_5xl,
                                    { paddingBottom: 200 },
                                ], children: [logoutBtn, checkBtn] }))] }) }) }), !webLayout && (_jsx(View, { style: [
                    a.align_center,
                    t.atoms.bg,
                    gtMobile ? a.px_5xl : a.px_xl,
                    { paddingBottom: Math.max(insets.bottom, a.pb_5xl.paddingBottom) },
                ], children: _jsxs(View, { style: [a.w_full, a.gap_sm, { maxWidth: COL_WIDTH }], children: [checkBtn, logoutBtn] }) }))] }));
}
function msToString(ms) {
    if (ms && ms > 0) {
        var estimatedTimeMins = Math.ceil(ms / 60e3);
        if (estimatedTimeMins > 59) {
            var estimatedTimeHrs = Math.round(estimatedTimeMins / 60);
            if (estimatedTimeHrs > 6) {
                // dont even bother
                return undefined;
            }
            // hours
            return "".concat(estimatedTimeHrs, " ").concat(plural(estimatedTimeHrs, {
                one: 'hour',
                other: 'hours',
            }));
        }
        // minutes
        return "".concat(estimatedTimeMins, " ").concat(plural(estimatedTimeMins, {
            one: 'minute',
            other: 'minutes',
        }));
    }
    return undefined;
}
var templateObject_1, templateObject_2;
