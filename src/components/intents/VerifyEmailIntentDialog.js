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
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useAgent, useSession } from '#/state/session';
import { atoms as a, useBreakpoints, useTheme } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { useConfirmEmail } from '#/components/dialogs/EmailDialog/data/useConfirmEmail';
import { Divider } from '#/components/Divider';
import { ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as Resend } from '#/components/icons/ArrowRotate';
import { useIntentDialogs } from '#/components/intents/IntentDialogs';
import { Loader } from '#/components/Loader';
import { Text } from '#/components/Typography';
import { IS_NATIVE } from '#/env';
export function VerifyEmailIntentDialog() {
    var control = useIntentDialogs().verifyEmailDialogControl;
    return (_jsxs(Dialog.Outer, { control: control, children: [_jsx(Dialog.Handle, {}), _jsx(Inner, { control: control })] }));
}
function Inner(_a) {
    var _this = this;
    var t = useTheme();
    var gtMobile = useBreakpoints().gtMobile;
    var _ = useLingui()._;
    var state = useIntentDialogs().verifyEmailState;
    var _b = useState('loading'), status = _b[0], setStatus = _b[1];
    var _c = useState(false), sending = _c[0], setSending = _c[1];
    var agent = useAgent();
    var currentAccount = useSession().currentAccount;
    var confirmEmail = useConfirmEmail({
        onSuccess: function () { return setStatus('success'); },
        onError: function () { return setStatus('failure'); },
    }).mutate;
    useEffect(function () {
        if (state === null || state === void 0 ? void 0 : state.code) {
            confirmEmail({ token: state.code });
        }
    }, [state === null || state === void 0 ? void 0 : state.code, confirmEmail]);
    var onPressResendEmail = function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setSending(true);
                    return [4 /*yield*/, agent.com.atproto.server.requestEmailConfirmation()];
                case 1:
                    _a.sent();
                    setSending(false);
                    setStatus('resent');
                    return [2 /*return*/];
            }
        });
    }); };
    return (_jsxs(Dialog.ScrollableInner, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Verify email dialog"], ["Verify email dialog"])))), style: [
            gtMobile ? { width: 'auto', maxWidth: 400, minWidth: 200 } : a.w_full,
        ], children: [_jsxs(View, { style: [a.gap_xl], children: [status === 'loading' ? (_jsx(View, { style: [a.py_2xl, a.align_center, a.justify_center], children: _jsx(Loader, { size: "xl", fill: t.atoms.text_contrast_low.color }) })) : status === 'success' ? (_jsxs(View, { style: [a.gap_sm, IS_NATIVE && a.pb_xl], children: [_jsx(Text, { style: [a.font_bold, a.text_2xl], children: _jsx(Trans, { children: "Email Verified" }) }), _jsx(Text, { style: [a.text_md, a.leading_snug], children: _jsx(Trans, { children: "Thanks, you have successfully verified your email address. You can close this dialog." }) })] })) : status === 'failure' ? (_jsxs(View, { style: [a.gap_sm], children: [_jsx(Text, { style: [a.font_bold, a.text_2xl], children: _jsx(Trans, { children: "Invalid Verification Code" }) }), _jsx(Text, { style: [a.text_md, a.leading_snug], children: _jsx(Trans, { children: "The verification code you have provided is invalid. Please make sure that you have used the correct verification link or request a new one." }) })] })) : (_jsxs(View, { style: [a.gap_sm, IS_NATIVE && a.pb_xl], children: [_jsx(Text, { style: [a.font_bold, a.text_2xl], children: _jsx(Trans, { children: "Email Resent" }) }), _jsx(Text, { style: [a.text_md, a.leading_snug], children: _jsxs(Trans, { children: ["We have sent another verification email to", ' ', _jsx(Text, { style: [a.text_md, a.font_semi_bold], children: currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.email }), "."] }) })] })), status === 'failure' && (_jsxs(_Fragment, { children: [_jsx(Divider, {}), _jsxs(Button, { label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Resend Verification Email"], ["Resend Verification Email"])))), onPress: onPressResendEmail, color: "secondary_inverted", size: "large", disabled: sending, children: [_jsx(ButtonIcon, { icon: sending ? Loader : Resend }), _jsx(ButtonText, { children: _jsx(Trans, { children: "Resend Email" }) })] })] }))] }), _jsx(Dialog.Close, {})] }));
}
var templateObject_1, templateObject_2;
