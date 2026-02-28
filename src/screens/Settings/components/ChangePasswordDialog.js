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
import { useWindowDimensions, View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import * as EmailValidator from 'email-validator';
import { cleanError, isNetworkError } from '#/lib/strings/errors';
import { checkAndFormatResetCode } from '#/lib/strings/password';
import { logger } from '#/logger';
import { useAgent, useSession } from '#/state/session';
import { ErrorMessage } from '#/view/com/util/error/ErrorMessage';
import { android, atoms as a, web } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import * as TextField from '#/components/forms/TextField';
import { Loader } from '#/components/Loader';
import { Text } from '#/components/Typography';
import { IS_NATIVE } from '#/env';
var Stages;
(function (Stages) {
    Stages["RequestCode"] = "RequestCode";
    Stages["ChangePassword"] = "ChangePassword";
    Stages["Done"] = "Done";
})(Stages || (Stages = {}));
export function ChangePasswordDialog(_a) {
    var control = _a.control;
    var height = useWindowDimensions().height;
    return (_jsxs(Dialog.Outer, { control: control, nativeOptions: android({ minHeight: height / 2 }), children: [_jsx(Dialog.Handle, {}), _jsx(Inner, {})] }));
}
function Inner() {
    var _this = this;
    var _ = useLingui()._;
    var currentAccount = useSession().currentAccount;
    var agent = useAgent();
    var control = Dialog.useDialogContext();
    var _a = useState(Stages.RequestCode), stage = _a[0], setStage = _a[1];
    var _b = useState(false), isProcessing = _b[0], setIsProcessing = _b[1];
    var _c = useState(''), resetCode = _c[0], setResetCode = _c[1];
    var _d = useState(''), newPassword = _d[0], setNewPassword = _d[1];
    var _e = useState(''), error = _e[0], setError = _e[1];
    var uiStrings = {
        RequestCode: {
            title: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Change your password"], ["Change your password"])))),
            message: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["If you want to change your password, we will send you a code to verify that this is your account."], ["If you want to change your password, we will send you a code to verify that this is your account."])))),
        },
        ChangePassword: {
            title: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Enter code"], ["Enter code"])))),
            message: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Please enter the code you received and the new password you would like to use."], ["Please enter the code you received and the new password you would like to use."])))),
        },
        Done: {
            title: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Password changed"], ["Password changed"])))),
            message: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Your password has been changed successfully! Please use your new password when you sign in to Bluesky from now on."], ["Your password has been changed successfully! Please use your new password when you sign in to Bluesky from now on."])))),
        },
    };
    var onRequestCode = function () { return __awaiter(_this, void 0, void 0, function () {
        var e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.email) ||
                        !EmailValidator.validate(currentAccount.email)) {
                        return [2 /*return*/, setError(_(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Your email appears to be invalid."], ["Your email appears to be invalid."])))))];
                    }
                    setError('');
                    setIsProcessing(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, agent.com.atproto.server.requestPasswordReset({
                            email: currentAccount.email,
                        })];
                case 2:
                    _a.sent();
                    setStage(Stages.ChangePassword);
                    return [3 /*break*/, 5];
                case 3:
                    e_1 = _a.sent();
                    if (isNetworkError(e_1)) {
                        setError(_(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Unable to contact your service. Please check your internet connection and try again."], ["Unable to contact your service. Please check your internet connection and try again."])))));
                    }
                    else {
                        logger.error('Failed to request password reset', { safeMessage: e_1 });
                        setError(cleanError(e_1));
                    }
                    return [3 /*break*/, 5];
                case 4:
                    setIsProcessing(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var onChangePassword = function () { return __awaiter(_this, void 0, void 0, function () {
        var formattedCode, e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    formattedCode = checkAndFormatResetCode(resetCode);
                    if (!formattedCode) {
                        setError(_(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["You have entered an invalid code. It should look like XXXXX-XXXXX."], ["You have entered an invalid code. It should look like XXXXX-XXXXX."])))));
                        return [2 /*return*/];
                    }
                    if (!newPassword) {
                        setError(_(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["Please enter a password. It must be at least 8 characters long."], ["Please enter a password. It must be at least 8 characters long."])))));
                        return [2 /*return*/];
                    }
                    if (newPassword.length < 8) {
                        setError(_(msg(templateObject_11 || (templateObject_11 = __makeTemplateObject(["Password must be at least 8 characters long."], ["Password must be at least 8 characters long."])))));
                        return [2 /*return*/];
                    }
                    setError('');
                    setIsProcessing(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, agent.com.atproto.server.resetPassword({
                            token: formattedCode,
                            password: newPassword,
                        })];
                case 2:
                    _a.sent();
                    setStage(Stages.Done);
                    return [3 /*break*/, 5];
                case 3:
                    e_2 = _a.sent();
                    if (isNetworkError(e_2)) {
                        setError(_(msg(templateObject_12 || (templateObject_12 = __makeTemplateObject(["Unable to contact your service. Please check your internet connection and try again."], ["Unable to contact your service. Please check your internet connection and try again."])))));
                    }
                    else if (e_2 === null || e_2 === void 0 ? void 0 : e_2.toString().includes('Token is invalid')) {
                        setError(_(msg(templateObject_13 || (templateObject_13 = __makeTemplateObject(["This confirmation code is not valid. Please try again."], ["This confirmation code is not valid. Please try again."])))));
                    }
                    else {
                        logger.error('Failed to set new password', { safeMessage: e_2 });
                        setError(cleanError(e_2));
                    }
                    return [3 /*break*/, 5];
                case 4:
                    setIsProcessing(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var onBlur = function () {
        var formattedCode = checkAndFormatResetCode(resetCode);
        if (!formattedCode) {
            return;
        }
        setResetCode(formattedCode);
    };
    return (_jsxs(Dialog.ScrollableInner, { label: _(msg(templateObject_14 || (templateObject_14 = __makeTemplateObject(["Change password dialog"], ["Change password dialog"])))), style: web({ maxWidth: 400 }), children: [_jsxs(View, { style: [a.gap_xl], children: [_jsxs(View, { style: [a.gap_sm], children: [_jsx(Text, { style: [a.font_bold, a.text_2xl], children: uiStrings[stage].title }), error ? (_jsx(View, { style: [a.rounded_sm, a.overflow_hidden], children: _jsx(ErrorMessage, { message: error }) })) : null, _jsx(Text, { style: [a.text_md, a.leading_snug], children: uiStrings[stage].message })] }), stage === Stages.ChangePassword && (_jsxs(View, { style: [a.gap_md], children: [_jsxs(View, { children: [_jsx(TextField.LabelText, { children: _jsx(Trans, { children: "Confirmation code" }) }), _jsx(TextField.Root, { children: _jsx(TextField.Input, { label: _(msg(templateObject_15 || (templateObject_15 = __makeTemplateObject(["Confirmation code"], ["Confirmation code"])))), placeholder: "XXXXX-XXXXX", value: resetCode, onChangeText: setResetCode, onBlur: onBlur, autoCapitalize: "none", autoCorrect: false, autoComplete: "one-time-code" }) })] }), _jsxs(View, { children: [_jsx(TextField.LabelText, { children: _jsx(Trans, { children: "New password" }) }), _jsx(TextField.Root, { children: _jsx(TextField.Input, { label: _(msg(templateObject_16 || (templateObject_16 = __makeTemplateObject(["New password"], ["New password"])))), placeholder: _(msg(templateObject_17 || (templateObject_17 = __makeTemplateObject(["At least 8 characters"], ["At least 8 characters"])))), value: newPassword, onChangeText: setNewPassword, secureTextEntry: true, autoCapitalize: "none", autoComplete: "new-password", passwordRules: "minlength: 8;" }) })] })] })), _jsx(View, { style: [a.gap_sm], children: stage === Stages.RequestCode ? (_jsxs(_Fragment, { children: [_jsxs(Button, { label: _(msg(templateObject_18 || (templateObject_18 = __makeTemplateObject(["Request code"], ["Request code"])))), color: "primary", size: "large", disabled: isProcessing, onPress: onRequestCode, children: [_jsx(ButtonText, { children: _jsx(Trans, { children: "Request code" }) }), isProcessing && _jsx(ButtonIcon, { icon: Loader })] }), _jsx(Button, { label: _(msg(templateObject_19 || (templateObject_19 = __makeTemplateObject(["Already have a code?"], ["Already have a code?"])))), onPress: function () { return setStage(Stages.ChangePassword); }, size: "large", color: "primary_subtle", disabled: isProcessing, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Already have a code?" }) }) }), IS_NATIVE && (_jsx(Button, { label: _(msg(templateObject_20 || (templateObject_20 = __makeTemplateObject(["Cancel"], ["Cancel"])))), color: "secondary", size: "large", disabled: isProcessing, onPress: function () { return control.close(); }, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Cancel" }) }) }))] })) : stage === Stages.ChangePassword ? (_jsxs(_Fragment, { children: [_jsxs(Button, { label: _(msg(templateObject_21 || (templateObject_21 = __makeTemplateObject(["Change password"], ["Change password"])))), color: "primary", size: "large", disabled: isProcessing, onPress: onChangePassword, children: [_jsx(ButtonText, { children: _jsx(Trans, { children: "Change password" }) }), isProcessing && _jsx(ButtonIcon, { icon: Loader })] }), _jsx(Button, { label: _(msg(templateObject_22 || (templateObject_22 = __makeTemplateObject(["Back"], ["Back"])))), color: "secondary", size: "large", disabled: isProcessing, onPress: function () {
                                        setResetCode('');
                                        setStage(Stages.RequestCode);
                                    }, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Back" }) }) })] })) : stage === Stages.Done ? (_jsx(Button, { label: _(msg(templateObject_23 || (templateObject_23 = __makeTemplateObject(["Close"], ["Close"])))), color: "primary", size: "large", onPress: function () { return control.close(); }, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Close" }) }) })) : null })] }), _jsx(Dialog.Close, {})] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15, templateObject_16, templateObject_17, templateObject_18, templateObject_19, templateObject_20, templateObject_21, templateObject_22, templateObject_23;
