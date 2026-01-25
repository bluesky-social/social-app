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
import React, { useState } from 'react';
import { ActivityIndicator, Keyboard, View } from 'react-native';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import * as EmailValidator from 'email-validator';
import { isNetworkError } from '#/lib/strings/errors';
import { cleanError } from '#/lib/strings/errors';
import { logger } from '#/logger';
import { Agent } from '#/state/session/agent';
import { atoms as a, useTheme } from '#/alf';
import { Button, ButtonText } from '#/components/Button';
import { FormError } from '#/components/forms/FormError';
import { HostingProvider } from '#/components/forms/HostingProvider';
import * as TextField from '#/components/forms/TextField';
import { At_Stroke2_Corner0_Rounded as At } from '#/components/icons/At';
import { Text } from '#/components/Typography';
import { FormContainer } from './FormContainer';
export var ForgotPasswordForm = function (_a) {
    var error = _a.error, serviceUrl = _a.serviceUrl, serviceDescription = _a.serviceDescription, setError = _a.setError, setServiceUrl = _a.setServiceUrl, onPressBack = _a.onPressBack, onEmailSent = _a.onEmailSent;
    var t = useTheme();
    var _b = useState(false), isProcessing = _b[0], setIsProcessing = _b[1];
    var _c = useState(''), email = _c[0], setEmail = _c[1];
    var _ = useLingui()._;
    var onPressSelectService = React.useCallback(function () {
        Keyboard.dismiss();
    }, []);
    var onPressNext = function () { return __awaiter(void 0, void 0, void 0, function () {
        var agent, e_1, errMsg;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!EmailValidator.validate(email)) {
                        return [2 /*return*/, setError(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Your email appears to be invalid."], ["Your email appears to be invalid."])))))];
                    }
                    setError('');
                    setIsProcessing(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    agent = new Agent(null, { service: serviceUrl });
                    return [4 /*yield*/, agent.com.atproto.server.requestPasswordReset({ email: email })];
                case 2:
                    _a.sent();
                    onEmailSent();
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _a.sent();
                    errMsg = e_1.toString();
                    logger.warn('Failed to request password reset', { error: e_1 });
                    setIsProcessing(false);
                    if (isNetworkError(e_1)) {
                        setError(_(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Unable to contact your service. Please check your Internet connection."], ["Unable to contact your service. Please check your Internet connection."])))));
                    }
                    else {
                        setError(cleanError(errMsg));
                    }
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    return (_jsxs(FormContainer, { testID: "forgotPasswordForm", titleText: _jsx(Trans, { children: "Reset password" }), children: [_jsxs(View, { children: [_jsx(TextField.LabelText, { children: _jsx(Trans, { children: "Hosting provider" }) }), _jsx(HostingProvider, { serviceUrl: serviceUrl, onSelectServiceUrl: setServiceUrl, onOpenDialog: onPressSelectService })] }), _jsxs(View, { children: [_jsx(TextField.LabelText, { children: _jsx(Trans, { children: "Email address" }) }), _jsxs(TextField.Root, { children: [_jsx(TextField.Icon, { icon: At }), _jsx(TextField.Input, { testID: "forgotPasswordEmail", label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Enter your email address"], ["Enter your email address"])))), autoCapitalize: "none", autoFocus: true, autoCorrect: false, autoComplete: "email", value: email, onChangeText: setEmail, editable: !isProcessing, accessibilityHint: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Sets email for password reset"], ["Sets email for password reset"])))) })] })] }), _jsx(Text, { style: [t.atoms.text_contrast_high, a.leading_snug], children: _jsx(Trans, { children: "Enter the email you used to create your account. We'll send you a \"reset code\" so you can set a new password." }) }), _jsx(FormError, { error: error }), _jsxs(View, { style: [a.flex_row, a.align_center, a.pt_md], children: [_jsx(Button, { label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Back"], ["Back"])))), variant: "solid", color: "secondary", size: "large", onPress: onPressBack, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Back" }) }) }), _jsx(View, { style: a.flex_1 }), !serviceDescription || isProcessing ? (_jsx(ActivityIndicator, {})) : (_jsx(Button, { label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Next"], ["Next"])))), variant: "solid", color: 'primary', size: "large", onPress: onPressNext, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Next" }) }) })), !serviceDescription || isProcessing ? (_jsx(Text, { style: [t.atoms.text_contrast_high, a.pl_md], children: _jsx(Trans, { children: "Processing..." }) })) : undefined] }), _jsx(View, { style: [
                    t.atoms.border_contrast_medium,
                    a.border_t,
                    a.pt_2xl,
                    a.mt_md,
                    a.flex_row,
                    a.justify_center,
                ], children: _jsx(Button, { testID: "skipSendEmailButton", onPress: onEmailSent, label: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Go to next"], ["Go to next"])))), accessibilityHint: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Navigates to the next screen"], ["Navigates to the next screen"])))), size: "large", variant: "ghost", color: "secondary", children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Already have a code?" }) }) }) })] }));
};
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8;
