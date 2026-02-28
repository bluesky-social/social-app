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
import { useState } from 'react';
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { cleanError, isNetworkError } from '#/lib/strings/errors';
import { checkAndFormatResetCode } from '#/lib/strings/password';
import { logger } from '#/logger';
import { Agent } from '#/state/session/agent';
import { atoms as a, web } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { FormError } from '#/components/forms/FormError';
import * as TextField from '#/components/forms/TextField';
import { Lock_Stroke2_Corner0_Rounded as Lock } from '#/components/icons/Lock';
import { Ticket_Stroke2_Corner0_Rounded as Ticket } from '#/components/icons/Ticket';
import { Loader } from '#/components/Loader';
import { Text } from '#/components/Typography';
import { useAnalytics } from '#/analytics';
import { IS_WEB } from '#/env';
import { FormContainer } from './FormContainer';
export var SetNewPasswordForm = function (_a) {
    var error = _a.error, serviceUrl = _a.serviceUrl, setError = _a.setError, onPressBack = _a.onPressBack, onPasswordSet = _a.onPasswordSet;
    var _ = useLingui()._;
    var ax = useAnalytics();
    var _b = useState(false), isProcessing = _b[0], setIsProcessing = _b[1];
    var _c = useState(''), resetCode = _c[0], setResetCode = _c[1];
    var _d = useState(''), password = _d[0], setPassword = _d[1];
    var onPressNext = function () { return __awaiter(void 0, void 0, void 0, function () {
        var formattedCode, agent, e_1, errMsg;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    formattedCode = checkAndFormatResetCode(resetCode);
                    if (!formattedCode) {
                        setError(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["You have entered an invalid code. It should look like XXXXX-XXXXX."], ["You have entered an invalid code. It should look like XXXXX-XXXXX."])))));
                        ax.metric('signin:passwordResetFailure', {});
                        return [2 /*return*/];
                    }
                    // TODO Better password strength check
                    if (!password) {
                        setError(_(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Please enter a password."], ["Please enter a password."])))));
                        return [2 /*return*/];
                    }
                    setError('');
                    setIsProcessing(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    agent = new Agent(null, { service: serviceUrl });
                    return [4 /*yield*/, agent.com.atproto.server.resetPassword({
                            token: formattedCode,
                            password: password,
                        })];
                case 2:
                    _a.sent();
                    onPasswordSet();
                    ax.metric('signin:passwordResetSuccess', {});
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _a.sent();
                    errMsg = e_1.toString();
                    logger.warn('Failed to set new password', { error: e_1 });
                    ax.metric('signin:passwordResetFailure', {});
                    setIsProcessing(false);
                    if (isNetworkError(e_1)) {
                        setError(_(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Unable to contact your service. Please check your Internet connection."], ["Unable to contact your service. Please check your Internet connection."])))));
                    }
                    else {
                        setError(cleanError(errMsg));
                    }
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var onBlur = function () {
        var formattedCode = checkAndFormatResetCode(resetCode);
        if (!formattedCode) {
            setError(_(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["You have entered an invalid code. It should look like XXXXX-XXXXX."], ["You have entered an invalid code. It should look like XXXXX-XXXXX."])))));
            return;
        }
        setResetCode(formattedCode);
    };
    return (_jsxs(FormContainer, { testID: "setNewPasswordForm", titleText: _jsx(Trans, { children: "Set new password" }), children: [_jsx(Text, { style: [a.leading_snug, a.mb_sm], children: _jsx(Trans, { children: "You will receive an email with a \"reset code.\" Enter that code here, then enter your new password." }) }), _jsxs(View, { children: [_jsx(TextField.LabelText, { children: _jsx(Trans, { children: "Reset code" }) }), _jsxs(TextField.Root, { children: [_jsx(TextField.Icon, { icon: Ticket }), _jsx(TextField.Input, { testID: "resetCodeInput", label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Looks like XXXXX-XXXXX"], ["Looks like XXXXX-XXXXX"])))), autoCapitalize: "none", autoFocus: true, autoCorrect: false, autoComplete: "off", value: resetCode, onChangeText: setResetCode, onFocus: function () { return setError(''); }, onBlur: onBlur, editable: !isProcessing, accessibilityHint: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Input code sent to your email for password reset"], ["Input code sent to your email for password reset"])))) })] })] }), _jsxs(View, { children: [_jsx(TextField.LabelText, { children: _jsx(Trans, { children: "New password" }) }), _jsxs(TextField.Root, { children: [_jsx(TextField.Icon, { icon: Lock }), _jsx(TextField.Input, { testID: "newPasswordInput", label: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Enter a password"], ["Enter a password"])))), autoCapitalize: "none", autoCorrect: false, returnKeyType: "done", secureTextEntry: true, autoComplete: "new-password", passwordRules: "minlength: 8;", clearButtonMode: "while-editing", value: password, onChangeText: setPassword, onSubmitEditing: onPressNext, editable: !isProcessing, accessibilityHint: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Input new password"], ["Input new password"])))) })] })] }), _jsx(FormError, { error: error }), _jsxs(View, { style: [web([a.flex_row, a.align_center]), a.pt_lg], children: [IS_WEB && (_jsxs(_Fragment, { children: [_jsx(Button, { label: _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Back"], ["Back"])))), variant: "solid", color: "secondary", size: "large", onPress: onPressBack, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Back" }) }) }), _jsx(View, { style: a.flex_1 })] })), _jsxs(Button, { label: _(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["Next"], ["Next"])))), color: "primary", size: "large", onPress: onPressNext, disabled: isProcessing, children: [_jsx(ButtonText, { children: _jsx(Trans, { children: "Next" }) }), isProcessing && _jsx(ButtonIcon, { icon: Loader })] })] })] }));
};
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10;
