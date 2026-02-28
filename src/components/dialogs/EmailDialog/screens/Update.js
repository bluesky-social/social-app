var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
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
import { useReducer } from 'react';
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { validate as validateEmail } from 'email-validator';
import { wait } from '#/lib/async/wait';
import { useCleanError } from '#/lib/hooks/useCleanError';
import { logger } from '#/logger';
import { useSession } from '#/state/session';
import { atoms as a, useTheme } from '#/alf';
import { Admonition } from '#/components/Admonition';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { ResendEmailText } from '#/components/dialogs/EmailDialog/components/ResendEmailText';
import { isValidCode, TokenField, } from '#/components/dialogs/EmailDialog/components/TokenField';
import { useRequestEmailUpdate } from '#/components/dialogs/EmailDialog/data/useRequestEmailUpdate';
import { useRequestEmailVerification } from '#/components/dialogs/EmailDialog/data/useRequestEmailVerification';
import { useUpdateEmail } from '#/components/dialogs/EmailDialog/data/useUpdateEmail';
import { Divider } from '#/components/Divider';
import * as TextField from '#/components/forms/TextField';
import { CheckThick_Stroke2_Corner0_Rounded as Check } from '#/components/icons/Check';
import { Envelope_Stroke2_Corner0_Rounded as Envelope } from '#/components/icons/Envelope';
import { Loader } from '#/components/Loader';
import { Text } from '#/components/Typography';
function reducer(state, action) {
    switch (action.type) {
        case 'setStep': {
            return __assign(__assign({}, state), { step: action.step });
        }
        case 'setError': {
            return __assign(__assign({}, state), { error: action.error, mutationStatus: 'error' });
        }
        case 'setMutationStatus': {
            return __assign(__assign({}, state), { error: '', mutationStatus: action.status });
        }
        case 'setEmail': {
            var emailValid = validateEmail(action.value);
            return __assign(__assign({}, state), { step: 'email', token: '', email: action.value, emailValid: emailValid });
        }
        case 'setToken': {
            return __assign(__assign({}, state), { error: '', token: action.value });
        }
    }
}
export function Update(_props) {
    var _this = this;
    var t = useTheme();
    var _ = useLingui()._;
    var cleanError = useCleanError();
    var currentAccount = useSession().currentAccount;
    var _a = useReducer(reducer, {
        step: 'email',
        mutationStatus: 'default',
        error: '',
        email: '',
        emailValid: true,
        token: '',
    }), state = _a[0], dispatch = _a[1];
    var updateEmail = useUpdateEmail().mutateAsync;
    var requestEmailUpdate = useRequestEmailUpdate().mutateAsync;
    var requestEmailVerification = useRequestEmailVerification().mutateAsync;
    var handleEmailChange = function (email) {
        dispatch({
            type: 'setEmail',
            value: email,
        });
    };
    var handleUpdateEmail = function () { return __awaiter(_this, void 0, void 0, function () {
        var status_1, _a, e_1, clean;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (state.step === 'token' && !isValidCode(state.token)) {
                        dispatch({
                            type: 'setError',
                            error: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Please enter a valid code."], ["Please enter a valid code."])))),
                        });
                        return [2 /*return*/];
                    }
                    dispatch({
                        type: 'setMutationStatus',
                        status: 'pending',
                    });
                    if (state.emailValid === false) {
                        dispatch({
                            type: 'setError',
                            error: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Please enter a valid email address."], ["Please enter a valid email address."])))),
                        });
                        return [2 /*return*/];
                    }
                    if (state.email === currentAccount.email) {
                        dispatch({
                            type: 'setError',
                            error: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["This email is already associated with your account."], ["This email is already associated with your account."])))),
                        });
                        return [2 /*return*/];
                    }
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 8, , 9]);
                    return [4 /*yield*/, wait(1000, updateEmail({
                            email: state.email,
                            token: state.token,
                        }))];
                case 2:
                    status_1 = (_b.sent()).status;
                    if (!(status_1 === 'tokenRequired')) return [3 /*break*/, 3];
                    dispatch({
                        type: 'setStep',
                        step: 'token',
                    });
                    dispatch({
                        type: 'setMutationStatus',
                        status: 'default',
                    });
                    return [3 /*break*/, 7];
                case 3:
                    if (!(status_1 === 'success')) return [3 /*break*/, 7];
                    dispatch({
                        type: 'setMutationStatus',
                        status: 'success',
                    });
                    _b.label = 4;
                case 4:
                    _b.trys.push([4, 6, , 7]);
                    // fire off a confirmation email immediately
                    return [4 /*yield*/, requestEmailVerification()];
                case 5:
                    // fire off a confirmation email immediately
                    _b.sent();
                    return [3 /*break*/, 7];
                case 6:
                    _a = _b.sent();
                    return [3 /*break*/, 7];
                case 7: return [3 /*break*/, 9];
                case 8:
                    e_1 = _b.sent();
                    logger.error('EmailDialog: update email failed', { safeMessage: e_1 });
                    clean = cleanError(e_1).clean;
                    dispatch({
                        type: 'setError',
                        error: clean || _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Failed to update email, please try again."], ["Failed to update email, please try again."])))),
                    });
                    return [3 /*break*/, 9];
                case 9: return [2 /*return*/];
            }
        });
    }); };
    return (_jsxs(View, { style: [a.gap_lg], children: [_jsx(Text, { style: [a.text_xl, a.font_bold], children: _jsx(Trans, { children: "Update your email" }) }), (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.emailAuthFactor) && (_jsx(Admonition, { type: "warning", children: _jsx(Trans, { children: "If you update your email address, email 2FA will be disabled." }) })), _jsxs(View, { style: [a.gap_md], children: [_jsxs(View, { children: [_jsx(Text, { style: [a.pb_sm, a.leading_snug, t.atoms.text_contrast_medium], children: _jsx(Trans, { children: "Please enter your new email address." }) }), _jsxs(TextField.Root, { children: [_jsx(TextField.Icon, { icon: Envelope }), _jsx(TextField.Input, { label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["New email address"], ["New email address"])))), placeholder: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["alice@example.com"], ["alice@example.com"])))), defaultValue: state.email, onChangeText: state.mutationStatus === 'success'
                                            ? undefined
                                            : handleEmailChange, keyboardType: "email-address", autoComplete: "email", autoCapitalize: "none", onSubmitEditing: handleUpdateEmail })] })] }), state.step === 'token' && (_jsxs(_Fragment, { children: [_jsx(Divider, {}), _jsxs(View, { children: [_jsx(Text, { style: [a.text_md, a.pb_sm, a.font_semi_bold], children: _jsx(Trans, { children: "Security step required" }) }), _jsx(Text, { style: [a.pb_sm, a.leading_snug, t.atoms.text_contrast_medium], children: _jsx(Trans, { children: "Please enter the security code we sent to your previous email address." }) }), _jsx(TokenField, { value: state.token, onChangeText: state.mutationStatus === 'success'
                                            ? undefined
                                            : function (token) {
                                                dispatch({
                                                    type: 'setToken',
                                                    value: token,
                                                });
                                            }, onSubmitEditing: handleUpdateEmail }), state.mutationStatus !== 'success' && (_jsx(ResendEmailText, { onPress: requestEmailUpdate, style: [a.pt_sm] }))] })] })), state.error && _jsx(Admonition, { type: "error", children: state.error })] }), state.mutationStatus === 'success' ? (_jsxs(_Fragment, { children: [_jsx(Divider, {}), _jsxs(View, { style: [a.gap_sm], children: [_jsxs(View, { style: [a.flex_row, a.gap_sm, a.align_center], children: [_jsx(Check, { fill: t.palette.positive_500, size: "xs" }), _jsx(Text, { style: [a.text_md, a.font_bold], children: _jsx(Trans, { children: "Success!" }) })] }), _jsx(Text, { style: [a.leading_snug], children: _jsx(Trans, { children: "Please click on the link in the email we just sent you to verify your new email address. This is an important step to allow you to continue enjoying all the features of Bluesky." }) })] })] })) : (_jsxs(Button, { label: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Update email"], ["Update email"])))), size: "large", variant: "solid", color: "primary", onPress: handleUpdateEmail, disabled: !state.email ||
                    (state.step === 'token' &&
                        (!state.token || state.token.length !== 11)) ||
                    state.mutationStatus === 'pending', children: [_jsx(ButtonText, { children: _jsx(Trans, { children: "Update email" }) }), state.mutationStatus === 'pending' && _jsx(ButtonIcon, { icon: Loader })] }))] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7;
