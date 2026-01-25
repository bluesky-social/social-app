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
import { useState } from 'react';
import { View } from 'react-native';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { cleanError } from '#/lib/strings/errors';
import { useAgent, useSession } from '#/state/session';
import { ErrorMessage } from '#/view/com/util/error/ErrorMessage';
import * as Toast from '#/view/com/util/Toast';
import { atoms as a, useBreakpoints, useTheme } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import * as TextField from '#/components/forms/TextField';
import { Lock_Stroke2_Corner0_Rounded as Lock } from '#/components/icons/Lock';
import { Loader } from '#/components/Loader';
import { P, Text } from '#/components/Typography';
import { IS_NATIVE } from '#/env';
var Stages;
(function (Stages) {
    Stages[Stages["Email"] = 0] = "Email";
    Stages[Stages["ConfirmCode"] = 1] = "ConfirmCode";
})(Stages || (Stages = {}));
export function DisableEmail2FADialog(_a) {
    var _this = this;
    var control = _a.control;
    var _ = useLingui()._;
    var t = useTheme();
    var gtMobile = useBreakpoints().gtMobile;
    var currentAccount = useSession().currentAccount;
    var agent = useAgent();
    var _b = useState(Stages.Email), stage = _b[0], setStage = _b[1];
    var _c = useState(''), confirmationCode = _c[0], setConfirmationCode = _c[1];
    var _d = useState(false), isProcessing = _d[0], setIsProcessing = _d[1];
    var _e = useState(''), error = _e[0], setError = _e[1];
    var onSendEmail = function () { return __awaiter(_this, void 0, void 0, function () {
        var e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setError('');
                    setIsProcessing(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, agent.com.atproto.server.requestEmailUpdate()];
                case 2:
                    _a.sent();
                    setStage(Stages.ConfirmCode);
                    return [3 /*break*/, 5];
                case 3:
                    e_1 = _a.sent();
                    setError(cleanError(String(e_1)));
                    return [3 /*break*/, 5];
                case 4:
                    setIsProcessing(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var onConfirmDisable = function () { return __awaiter(_this, void 0, void 0, function () {
        var e_2, errMsg;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setError('');
                    setIsProcessing(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, 6, 7]);
                    if (!(currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.email)) return [3 /*break*/, 4];
                    return [4 /*yield*/, agent.com.atproto.server.updateEmail({
                            email: currentAccount.email,
                            token: confirmationCode.trim(),
                            emailAuthFactor: false,
                        })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, agent.resumeSession(agent.session)];
                case 3:
                    _a.sent();
                    Toast.show(_(msg({ message: 'Email 2FA disabled', context: 'toast' })));
                    _a.label = 4;
                case 4:
                    control.close();
                    return [3 /*break*/, 7];
                case 5:
                    e_2 = _a.sent();
                    errMsg = String(e_2);
                    if (errMsg.includes('Token is invalid')) {
                        setError(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Invalid 2FA confirmation code."], ["Invalid 2FA confirmation code."])))));
                    }
                    else {
                        setError(cleanError(errMsg));
                    }
                    return [3 /*break*/, 7];
                case 6:
                    setIsProcessing(false);
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    return (_jsxs(Dialog.Outer, { control: control, children: [_jsx(Dialog.Handle, {}), _jsx(Dialog.ScrollableInner, { accessibilityDescribedBy: "dialog-description", accessibilityLabelledBy: "dialog-title", children: _jsxs(View, { style: [a.relative, a.gap_md, a.w_full], children: [_jsx(Text, { nativeID: "dialog-title", style: [a.text_2xl, a.font_semi_bold, t.atoms.text], children: _jsx(Trans, { children: "Disable Email 2FA" }) }), _jsx(P, { nativeID: "dialog-description", children: stage === Stages.ConfirmCode ? (_jsxs(Trans, { children: ["An email has been sent to", ' ', (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.email) || '(no email)', ". It includes a confirmation code which you can enter below."] })) : (_jsx(Trans, { children: "To disable the email 2FA method, please verify your access to the email address." })) }), error ? _jsx(ErrorMessage, { message: error }) : undefined, stage === Stages.Email ? (_jsxs(View, { style: [
                                a.gap_sm,
                                gtMobile && [a.flex_row, a.justify_end, a.gap_md],
                            ], children: [_jsxs(Button, { testID: "sendEmailButton", variant: "solid", color: "primary", size: gtMobile ? 'small' : 'large', onPress: onSendEmail, label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Send verification email"], ["Send verification email"])))), disabled: isProcessing, children: [_jsx(ButtonText, { children: _jsx(Trans, { children: "Send verification email" }) }), isProcessing && _jsx(ButtonIcon, { icon: Loader })] }), _jsx(Button, { testID: "haveCodeButton", variant: "ghost", color: "primary", size: gtMobile ? 'small' : 'large', onPress: function () { return setStage(Stages.ConfirmCode); }, label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["I have a code"], ["I have a code"])))), disabled: isProcessing, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "I have a code" }) }) })] })) : stage === Stages.ConfirmCode ? (_jsxs(View, { children: [_jsxs(View, { style: [a.mb_md], children: [_jsx(TextField.LabelText, { children: _jsx(Trans, { children: "Confirmation code" }) }), _jsxs(TextField.Root, { children: [_jsx(TextField.Icon, { icon: Lock }), _jsx(Dialog.Input, { testID: "confirmationCode", label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Confirmation code"], ["Confirmation code"])))), autoCapitalize: "none", autoFocus: true, autoCorrect: false, autoComplete: "off", value: confirmationCode, onChangeText: setConfirmationCode, onSubmitEditing: onConfirmDisable, editable: !isProcessing })] })] }), _jsxs(View, { style: [
                                        a.gap_sm,
                                        gtMobile && [a.flex_row, a.justify_end, a.gap_md],
                                    ], children: [_jsx(Button, { testID: "resendCodeBtn", variant: "ghost", color: "primary", size: gtMobile ? 'small' : 'large', onPress: onSendEmail, label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Resend email"], ["Resend email"])))), disabled: isProcessing, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Resend email" }) }) }), _jsxs(Button, { testID: "confirmBtn", variant: "solid", color: "primary", size: gtMobile ? 'small' : 'large', onPress: onConfirmDisable, label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Confirm"], ["Confirm"])))), disabled: isProcessing, children: [_jsx(ButtonText, { children: _jsx(Trans, { children: "Confirm" }) }), isProcessing && _jsx(ButtonIcon, { icon: Loader })] })] })] })) : undefined, !gtMobile && IS_NATIVE && _jsx(View, { style: { height: 40 } })] }) })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6;
