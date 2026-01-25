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
import { useEffect, useMemo, useState } from 'react';
import { Text as NestedText, View } from 'react-native';
import { AppBskyContactStartPhoneVerification, AppBskyContactVerifyPhone, } from '@atproto/api';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useMutation } from '@tanstack/react-query';
import { clamp } from '#/lib/numbers';
import { cleanError, isNetworkError } from '#/lib/strings/errors';
import { logger } from '#/logger';
import { useAgent } from '#/state/session';
import { OnboardingPosition } from '#/screens/Onboarding/Layout';
import { atoms as a, useGutters, useTheme } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as RetryIcon } from '#/components/icons/ArrowRotate';
import { CircleCheck_Stroke2_Corner0_Rounded as CircleCheckIcon } from '#/components/icons/CircleCheck';
import { Warning_Stroke2_Corner0_Rounded as WarningIcon } from '#/components/icons/Warning';
import * as Layout from '#/components/Layout';
import { Loader } from '#/components/Loader';
import * as Toast from '#/components/Toast';
import { Text } from '#/components/Typography';
import { useAnalytics } from '#/analytics';
import { OTPInput } from '../components/OTPInput';
import { constructFullPhoneNumber, prettyPhoneNumber } from '../phone-number';
import { useOnPressBackButton } from '../state';
export function VerifyNumber(_a) {
    var _this = this;
    var state = _a.state, dispatch = _a.dispatch, context = _a.context, onSkip = _a.onSkip;
    var t = useTheme();
    var _ = useLingui()._;
    var ax = useAnalytics();
    var agent = useAgent();
    var gutters = useGutters([0, 'wide']);
    var _b = useState(''), otpCode = _b[0], setOtpCode = _b[1];
    var _c = useState(null), error = _c[0], setError = _c[1];
    var _d = useState(otpCode), prevOtpCode = _d[0], setPrevOtpCode = _d[1];
    if (otpCode !== prevOtpCode) {
        setPrevOtpCode(otpCode);
        setError(null);
    }
    var phone = useMemo(function () { return constructFullPhoneNumber(state.phoneCountryCode, state.phoneNumber); }, [state.phoneCountryCode, state.phoneNumber]);
    var prettyNumber = useMemo(function () { return prettyPhoneNumber(phone); }, [phone]);
    var _e = useMutation({
        mutationFn: function (code) { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, agent.app.bsky.contact.verifyPhone({ code: code, phone: phone })];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, res.data.token];
                }
            });
        }); },
        onSuccess: function (token) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // let the success state show for a moment
                setTimeout(function () {
                    dispatch({
                        type: 'VERIFY_PHONE_NUMBER_SUCCESS',
                        payload: {
                            token: token,
                        },
                    });
                }, 1000);
                ax.metric('contacts:phone:phoneVerified', { entryPoint: context });
                return [2 /*return*/];
            });
        }); },
        onMutate: function () { return setError(null); },
        onError: function (err) {
            setOtpCode('');
            if (isNetworkError(err)) {
                setError({
                    retryable: true,
                    isResendError: false,
                    message: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["A network error occurred. Please check your internet connection."], ["A network error occurred. Please check your internet connection."])))),
                });
            }
            else if (err instanceof AppBskyContactVerifyPhone.InvalidCodeError) {
                setError({
                    retryable: true,
                    isResendError: true,
                    message: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["This code is invalid. Resend to get a new code."], ["This code is invalid. Resend to get a new code."])))),
                });
            }
            else if (err instanceof AppBskyContactVerifyPhone.InvalidPhoneError) {
                setError({
                    retryable: false,
                    isResendError: false,
                    message: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["The verification provider was unable to send a code to your phone number. Please check your phone number and try again."], ["The verification provider was unable to send a code to your phone number. Please check your phone number and try again."])))),
                });
            }
            else if (err instanceof AppBskyContactVerifyPhone.RateLimitExceededError) {
                setError({
                    retryable: true,
                    isResendError: false,
                    message: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Too many attempts. Please wait a few minutes and try again."], ["Too many attempts. Please wait a few minutes and try again."])))),
                });
            }
            else {
                logger.error('Verify phone number failed', { safeMessage: err });
                setError({
                    retryable: true,
                    isResendError: false,
                    message: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["An error occurred. ", ""], ["An error occurred. ", ""])), cleanError(err))),
                });
            }
        },
    }), verifyNumber = _e.mutate, isPending = _e.isPending, isSuccess = _e.isSuccess;
    var _f = useMutation({
        mutationFn: function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, agent.app.bsky.contact.startPhoneVerification({ phone: phone })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); },
        onSuccess: function () {
            dispatch({ type: 'RESEND_VERIFICATION_CODE' });
            Toast.show(_(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["A new code has been sent"], ["A new code has been sent"])))));
        },
        onMutate: function () {
            setOtpCode('');
            setError(null);
        },
        onError: function (err) {
            if (isNetworkError(err)) {
                setError({
                    retryable: true,
                    isResendError: true,
                    message: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["A network error occurred. Please check your internet connection."], ["A network error occurred. Please check your internet connection."])))),
                });
            }
            else if (err instanceof AppBskyContactStartPhoneVerification.InvalidPhoneError) {
                setError({
                    retryable: false,
                    isResendError: true,
                    message: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["The verification provider was unable to send a code to your phone number. Please check your phone number and try again."], ["The verification provider was unable to send a code to your phone number. Please check your phone number and try again."])))),
                });
            }
            else if (err instanceof
                AppBskyContactStartPhoneVerification.RateLimitExceededError) {
                setError({
                    retryable: true,
                    isResendError: true,
                    message: _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Too many codes sent. Please wait a few minutes and try again."], ["Too many codes sent. Please wait a few minutes and try again."])))),
                });
            }
            else {
                logger.error('Resend failed', { safeMessage: err });
                setError({
                    retryable: true,
                    isResendError: true,
                    message: _(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["An error occurred. ", ""], ["An error occurred. ", ""])), cleanError(err))),
                });
            }
        },
    }), resendCode = _f.mutate, isResendingCode = _f.isPending;
    var onPressBack = useOnPressBackButton();
    return (_jsxs(View, { style: [a.h_full], children: [_jsxs(Layout.Header.Outer, { noBottomBorder: true, children: [_jsx(Layout.Header.BackButton, { onPress: onPressBack }), _jsx(Layout.Header.Content, {}), context === 'Onboarding' ? (_jsx(Button, { size: "small", color: "secondary", variant: "ghost", label: _(msg(templateObject_11 || (templateObject_11 = __makeTemplateObject(["Skip contact sharing and continue to the app"], ["Skip contact sharing and continue to the app"])))), onPress: onSkip, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Skip" }) }) })) : (_jsx(Layout.Header.Slot, {}))] }), _jsxs(Layout.Content, { contentContainerStyle: [gutters, a.pt_sm, a.flex_1], keyboardShouldPersistTaps: "always", children: [context === 'Onboarding' && _jsx(OnboardingPosition, {}), _jsx(Text, { style: [a.font_bold, a.text_3xl], children: _jsx(Trans, { children: "Verify phone number" }) }), _jsx(Text, { style: [
                            a.text_md,
                            t.atoms.text_contrast_medium,
                            a.leading_snug,
                            a.mt_sm,
                        ], children: _jsxs(Trans, { children: ["Enter the 6-digit code sent to ", prettyNumber] }) }), _jsx(View, { style: [a.mt_2xl], children: _jsx(OTPInput, { label: _(msg(templateObject_12 || (templateObject_12 = __makeTemplateObject(["Enter 6-digit code that was sent to your phone number"], ["Enter 6-digit code that was sent to your phone number"])))), value: otpCode, onChange: setOtpCode, onComplete: function (code) { return verifyNumber(code); } }) }), _jsx(View, { style: [a.mt_sm], children: _jsx(OTPStatus, { error: error, isPending: isPending, isResendingCode: isResendingCode, isSuccess: isSuccess, onResend: function () { return resendCode(); }, onRetry: function () { return verifyNumber(otpCode); }, lastCodeSentAt: state.lastSentAt }) })] })] }));
}
/**
 * Horrible component that takes all the state above and figures out what messages
 * and buttons to display.
 */
function OTPStatus(_a) {
    var _b;
    var error = _a.error, isPending = _a.isPending, isResendingCode = _a.isResendingCode, isSuccess = _a.isSuccess, onResend = _a.onResend, onRetry = _a.onRetry, lastCodeSentAt = _a.lastCodeSentAt;
    var _ = useLingui()._;
    var t = useTheme();
    var _c = useState(Date.now()), time = _c[0], setTime = _c[1];
    useEffect(function () {
        var interval = setInterval(function () {
            setTime(Date.now());
        }, 1000);
        return function () { return clearInterval(interval); };
    }, []);
    var timeUntilCanResend = Math.max(0, 30000 - (time - ((_b = lastCodeSentAt === null || lastCodeSentAt === void 0 ? void 0 : lastCodeSentAt.getTime()) !== null && _b !== void 0 ? _b : 0)));
    var isWaiting = timeUntilCanResend > 0;
    var Icon = null;
    var text = '';
    var textColor = t.atoms.text_contrast_medium.color;
    var showResendButton = false;
    var showRetryButton = false;
    if (isSuccess) {
        Icon = CircleCheckIcon;
        text = _(msg(templateObject_13 || (templateObject_13 = __makeTemplateObject(["Phone number verified"], ["Phone number verified"]))));
        textColor = t.palette.positive_500;
    }
    else if (isPending) {
        text = _(msg(templateObject_14 || (templateObject_14 = __makeTemplateObject(["Verifying..."], ["Verifying..."]))));
    }
    else if (error) {
        Icon = WarningIcon;
        text = error.message;
        textColor = t.palette.negative_500;
        if (error.retryable) {
            if (error.isResendError) {
                showResendButton = true;
            }
            else {
                showRetryButton = true;
            }
        }
    }
    else {
        showResendButton = true;
    }
    return (_jsxs(View, { style: [a.w_full, a.align_center], children: [text && (_jsxs(View, { style: [
                    a.gap_xs,
                    a.flex_row,
                    a.align_center,
                    (isSuccess || isPending) && a.mt_lg,
                ], children: [Icon && _jsx(Icon, { size: "xs", style: { color: textColor } }), _jsx(Text, { style: [
                            { color: textColor },
                            a.text_sm,
                            a.leading_snug,
                            a.text_center,
                        ], children: text })] })), showRetryButton && (_jsxs(Button, { size: "small", color: "secondary_inverted", label: _(msg(templateObject_15 || (templateObject_15 = __makeTemplateObject(["Retry"], ["Retry"])))), onPress: onRetry, style: [a.mt_2xl], children: [_jsx(ButtonIcon, { icon: RetryIcon }), _jsx(ButtonText, { children: _jsx(Trans, { children: "Retry" }) })] })), showResendButton && (_jsxs(Button, { size: "large", color: "secondary", variant: "ghost", label: _(msg(templateObject_16 || (templateObject_16 = __makeTemplateObject(["Resend code"], ["Resend code"])))), disabled: isResendingCode || isWaiting, onPress: onResend, style: [a.mt_2xl], children: [isResendingCode && _jsx(ButtonIcon, { icon: Loader }), _jsx(ButtonText, { children: isWaiting ? (_jsxs(Trans, { children: ["Resend code in", ' ', _jsxs(NestedText, { style: { fontVariant: ['tabular-nums'] }, children: ["00:", String(clamp(Math.round(timeUntilCanResend / 1000), 0, 30)).padStart(2, '0')] })] })) : (_jsx(Trans, { children: "Resend code" })) })] }))] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15, templateObject_16;
