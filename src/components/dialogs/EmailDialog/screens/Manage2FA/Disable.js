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
import { useReducer, useState } from 'react';
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { wait } from '#/lib/async/wait';
import { useCleanError } from '#/lib/hooks/useCleanError';
import { logger } from '#/logger';
import { useSession } from '#/state/session';
import { atoms as a, useTheme } from '#/alf';
import { Admonition } from '#/components/Admonition';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { useDialogContext } from '#/components/Dialog';
import { ResendEmailText } from '#/components/dialogs/EmailDialog/components/ResendEmailText';
import { isValidCode, TokenField, } from '#/components/dialogs/EmailDialog/components/TokenField';
import { useManageEmail2FA } from '#/components/dialogs/EmailDialog/data/useManageEmail2FA';
import { useRequestEmailUpdate } from '#/components/dialogs/EmailDialog/data/useRequestEmailUpdate';
import { Divider } from '#/components/Divider';
import { Check_Stroke2_Corner0_Rounded as Check } from '#/components/icons/Check';
import { Envelope_Stroke2_Corner0_Rounded as Envelope } from '#/components/icons/Envelope';
import { createStaticClick, InlineLinkText } from '#/components/Link';
import { Loader } from '#/components/Loader';
import { Span, Text } from '#/components/Typography';
function reducer(state, action) {
    switch (action.type) {
        case 'setError': {
            return __assign(__assign({}, state), { error: action.error, emailStatus: 'error', tokenStatus: 'error' });
        }
        case 'setStep': {
            return __assign(__assign({}, state), { error: '', step: action.step });
        }
        case 'setEmailStatus': {
            return __assign(__assign({}, state), { error: '', emailStatus: action.status });
        }
        case 'setTokenStatus': {
            return __assign(__assign({}, state), { error: '', tokenStatus: action.status });
        }
        default: {
            return state;
        }
    }
}
export function Disable() {
    var _this = this;
    var t = useTheme();
    var _ = useLingui()._;
    var cleanError = useCleanError();
    var currentAccount = useSession().currentAccount;
    var requestEmailUpdate = useRequestEmailUpdate().mutateAsync;
    var manageEmail2FA = useManageEmail2FA().mutateAsync;
    var control = useDialogContext();
    var _a = useState(''), token = _a[0], setToken = _a[1];
    var _b = useReducer(reducer, {
        error: '',
        step: 'email',
        emailStatus: 'default',
        tokenStatus: 'default',
    }), state = _b[0], dispatch = _b[1];
    var handleSendEmail = function () { return __awaiter(_this, void 0, void 0, function () {
        var e_1, clean;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    dispatch({ type: 'setEmailStatus', status: 'pending' });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, wait(1000, requestEmailUpdate())];
                case 2:
                    _a.sent();
                    dispatch({ type: 'setEmailStatus', status: 'success' });
                    setTimeout(function () {
                        dispatch({ type: 'setStep', step: 'token' });
                    }, 1000);
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _a.sent();
                    logger.error('Manage2FA: email update code request failed', {
                        safeMessage: e_1,
                    });
                    clean = cleanError(e_1).clean;
                    dispatch({
                        type: 'setError',
                        error: clean || _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Failed to send email, please try again."], ["Failed to send email, please try again."])))),
                    });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var handleManageEmail2FA = function () { return __awaiter(_this, void 0, void 0, function () {
        var e_2, clean;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!isValidCode(token)) {
                        dispatch({
                            type: 'setError',
                            error: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Please enter a valid code."], ["Please enter a valid code."])))),
                        });
                        return [2 /*return*/];
                    }
                    dispatch({ type: 'setTokenStatus', status: 'pending' });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, wait(1000, manageEmail2FA({ enabled: false, token: token }))];
                case 2:
                    _a.sent();
                    dispatch({ type: 'setTokenStatus', status: 'success' });
                    setTimeout(function () {
                        control.close();
                    }, 1000);
                    return [3 /*break*/, 4];
                case 3:
                    e_2 = _a.sent();
                    logger.error('Manage2FA: disable email 2FA failed', { safeMessage: e_2 });
                    clean = cleanError(e_2).clean;
                    dispatch({
                        type: 'setError',
                        error: clean || _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Failed to update email 2FA settings"], ["Failed to update email 2FA settings"])))),
                    });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    return (_jsxs(View, { style: [a.gap_sm], children: [_jsx(Text, { style: [a.text_xl, a.font_bold, a.leading_snug], children: _jsx(Trans, { children: "Disable email 2FA" }) }), state.step === 'email' ? (_jsxs(_Fragment, { children: [_jsx(Text, { style: [a.text_sm, a.leading_snug, t.atoms.text_contrast_medium], children: _jsxs(Trans, { children: ["To disable your email 2FA method, please verify your access to", ' ', _jsx(Span, { style: [a.font_semi_bold], children: currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.email })] }) }), _jsxs(View, { style: [a.gap_lg, a.pt_sm], children: [state.error && _jsx(Admonition, { type: "error", children: state.error }), _jsxs(Button, { label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Send email"], ["Send email"])))), size: "large", variant: "solid", color: "primary", onPress: handleSendEmail, disabled: state.emailStatus === 'pending', children: [_jsx(ButtonText, { children: _jsx(Trans, { children: "Send email" }) }), _jsx(ButtonIcon, { icon: state.emailStatus === 'pending'
                                            ? Loader
                                            : state.emailStatus === 'success'
                                                ? Check
                                                : Envelope })] }), _jsx(Divider, {}), _jsx(Text, { style: [a.text_sm, a.leading_snug, t.atoms.text_contrast_medium], children: _jsxs(Trans, { children: ["Have a code?", ' ', _jsx(InlineLinkText, __assign({ label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Enter code"], ["Enter code"])))) }, createStaticClick(function () {
                                            dispatch({ type: 'setStep', step: 'token' });
                                        }), { children: "Click here." }))] }) })] })] })) : (_jsxs(_Fragment, { children: [_jsx(Text, { style: [a.text_sm, a.leading_snug, t.atoms.text_contrast_medium], children: _jsxs(Trans, { children: ["To disable your email 2FA method, please verify your access to", ' ', _jsx(Span, { style: [a.font_semi_bold], children: currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.email })] }) }), _jsxs(View, { style: [a.gap_sm, a.py_sm], children: [_jsx(TokenField, { value: token, onChangeText: setToken, onSubmitEditing: handleManageEmail2FA }), _jsx(ResendEmailText, { onPress: handleSendEmail })] }), state.error && _jsx(Admonition, { type: "error", children: state.error }), _jsxs(Button, { label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Disable 2FA"], ["Disable 2FA"])))), size: "large", variant: "solid", color: "primary", onPress: handleManageEmail2FA, disabled: !token || token.length !== 11 || state.tokenStatus === 'pending', children: [_jsx(ButtonText, { children: _jsx(Trans, { children: "Disable 2FA" }) }), state.tokenStatus === 'pending' ? (_jsx(ButtonIcon, { icon: Loader })) : state.tokenStatus === 'success' ? (_jsx(ButtonIcon, { icon: Check })) : null] })] }))] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6;
