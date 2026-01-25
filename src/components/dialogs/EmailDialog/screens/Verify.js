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
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { wait } from '#/lib/async/wait';
import { useCleanError } from '#/lib/hooks/useCleanError';
import { logger } from '#/logger';
import { useSession } from '#/state/session';
import { atoms as a, useTheme } from '#/alf';
import { Admonition } from '#/components/Admonition';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { ResendEmailText } from '#/components/dialogs/EmailDialog/components/ResendEmailText';
import { isValidCode, TokenField, } from '#/components/dialogs/EmailDialog/components/TokenField';
import { useConfirmEmail } from '#/components/dialogs/EmailDialog/data/useConfirmEmail';
import { useRequestEmailVerification } from '#/components/dialogs/EmailDialog/data/useRequestEmailVerification';
import { useOnEmailVerified } from '#/components/dialogs/EmailDialog/events';
import { ScreenID, } from '#/components/dialogs/EmailDialog/types';
import { Divider } from '#/components/Divider';
import { CheckThick_Stroke2_Corner0_Rounded as Check } from '#/components/icons/Check';
import { Envelope_Stroke2_Corner0_Rounded as Envelope } from '#/components/icons/Envelope';
import { createStaticClick, InlineLinkText } from '#/components/Link';
import { Loader } from '#/components/Loader';
import { Span, Text } from '#/components/Typography';
function reducer(state, action) {
    switch (action.type) {
        case 'setStep': {
            return __assign(__assign({}, state), { error: '', mutationStatus: 'default', step: action.step });
        }
        case 'setError': {
            return __assign(__assign({}, state), { error: action.error, mutationStatus: 'error' });
        }
        case 'setMutationStatus': {
            return __assign(__assign({}, state), { error: '', mutationStatus: action.status });
        }
        case 'setToken': {
            return __assign(__assign({}, state), { error: '', token: action.value });
        }
    }
}
export function Verify(_a) {
    var _this = this;
    var _b;
    var config = _a.config, showScreen = _a.showScreen;
    var t = useTheme();
    var _ = useLingui()._;
    var cleanError = useCleanError();
    var currentAccount = useSession().currentAccount;
    var _c = useReducer(reducer, {
        step: 'email',
        mutationStatus: 'default',
        error: '',
        token: '',
    }), state = _c[0], dispatch = _c[1];
    var requestEmailVerification = useRequestEmailVerification().mutateAsync;
    var confirmEmail = useConfirmEmail().mutateAsync;
    useOnEmailVerified(function () {
        if (config.onVerify) {
            config.onVerify();
        }
        else {
            dispatch({
                type: 'setStep',
                step: 'success',
            });
        }
    });
    var handleRequestEmailVerification = function () { return __awaiter(_this, void 0, void 0, function () {
        var e_1, clean;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    dispatch({
                        type: 'setMutationStatus',
                        status: 'pending',
                    });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, wait(1000, requestEmailVerification())];
                case 2:
                    _a.sent();
                    dispatch({
                        type: 'setMutationStatus',
                        status: 'success',
                    });
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _a.sent();
                    logger.error('EmailDialog: sending verification email failed', {
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
    var handleConfirmEmail = function () { return __awaiter(_this, void 0, void 0, function () {
        var e_2, clean;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!isValidCode(state.token)) {
                        dispatch({
                            type: 'setError',
                            error: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Please enter a valid code."], ["Please enter a valid code."])))),
                        });
                        return [2 /*return*/];
                    }
                    dispatch({
                        type: 'setMutationStatus',
                        status: 'pending',
                    });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, wait(1000, confirmEmail({ token: state.token }))];
                case 2:
                    _a.sent();
                    dispatch({
                        type: 'setStep',
                        step: 'success',
                    });
                    return [3 /*break*/, 4];
                case 3:
                    e_2 = _a.sent();
                    logger.error('EmailDialog: confirming email failed', {
                        safeMessage: e_2,
                    });
                    clean = cleanError(e_2).clean;
                    dispatch({
                        type: 'setError',
                        error: clean || _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Failed to verify email, please try again."], ["Failed to verify email, please try again."])))),
                    });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    if (state.step === 'success') {
        return (_jsx(View, { style: [a.gap_lg], children: _jsxs(View, { style: [a.gap_sm], children: [_jsxs(Text, { style: [a.text_xl, a.font_bold], children: [_jsx(Span, { style: { top: 1 }, children: _jsx(Check, { size: "sm", fill: t.palette.positive_500 }) }), '  ', _jsx(Trans, { children: "Email verification complete!" })] }), _jsx(Text, { style: [a.text_sm, a.leading_snug, t.atoms.text_contrast_medium], children: _jsx(Trans, { children: "You have successfully verified your email address. You can close this dialog." }) })] }) }));
    }
    return (_jsxs(View, { style: [a.gap_lg], children: [_jsxs(View, { style: [a.gap_sm], children: [_jsx(Text, { style: [a.text_xl, a.font_bold], children: state.step === 'email' ? (state.mutationStatus === 'success' ? (_jsxs(_Fragment, { children: [_jsx(Span, { style: { top: 1 }, children: _jsx(Check, { size: "sm", fill: t.palette.positive_500 }) }), '  ', _jsx(Trans, { children: "Email sent!" })] })) : (_jsx(Trans, { children: "Verify your email" }))) : (_jsx(Trans, { comment: "Dialog title when a user is verifying their email address by entering a code they have been sent", children: "Verify email code" })) }), state.step === 'email' && state.mutationStatus !== 'success' && (_jsx(_Fragment, { children: (_b = config.instructions) === null || _b === void 0 ? void 0 : _b.map(function (int, i) { return (_jsx(Text, { style: [
                                a.italic,
                                a.text_sm,
                                a.leading_snug,
                                t.atoms.text_contrast_medium,
                            ], children: int }, i)); }) })), _jsx(Text, { style: [a.text_sm, a.leading_snug, t.atoms.text_contrast_medium], children: state.step === 'email' ? (state.mutationStatus === 'success' ? (_jsxs(Trans, { children: ["We sent an email to", ' ', _jsx(Span, { style: [a.font_semi_bold, t.atoms.text], children: currentAccount.email }), ' ', "containing a link. Please click on it to complete the email verification process."] })) : (_jsxs(Trans, { children: ["We'll send an email to", ' ', _jsx(Span, { style: [a.font_semi_bold, t.atoms.text], children: currentAccount.email }), ' ', "containing a link. Please click on it to complete the email verification process."] }))) : (_jsxs(Trans, { children: ["Please enter the code we sent to", ' ', _jsx(Span, { style: [a.font_semi_bold, t.atoms.text], children: currentAccount.email }), ' ', "below."] })) }), state.step === 'email' && state.mutationStatus !== 'success' && (_jsx(Text, { style: [a.text_sm, a.leading_snug, t.atoms.text_contrast_medium], children: _jsxs(Trans, { children: ["If you need to update your email,", ' ', _jsx(InlineLinkText, __assign({ label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Click here to update your email"], ["Click here to update your email"])))) }, createStaticClick(function () {
                                    showScreen({ id: ScreenID.Update });
                                }), { children: "click here" })), "."] }) })), state.step === 'email' && state.mutationStatus === 'success' && (_jsx(ResendEmailText, { onPress: requestEmailVerification }))] }), state.step === 'email' && state.mutationStatus !== 'success' ? (_jsxs(_Fragment, { children: [state.error && _jsx(Admonition, { type: "error", children: state.error }), _jsxs(Button, { label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Send verification email"], ["Send verification email"])))), size: "large", variant: "solid", color: "primary", onPress: handleRequestEmailVerification, disabled: state.mutationStatus === 'pending', children: [_jsx(ButtonText, { children: _jsx(Trans, { children: "Send email" }) }), _jsx(ButtonIcon, { icon: state.mutationStatus === 'pending' ? Loader : Envelope })] })] })) : null, state.step === 'email' && (_jsxs(_Fragment, { children: [_jsx(Divider, {}), _jsx(Text, { style: [a.text_sm, a.leading_snug, t.atoms.text_contrast_medium], children: _jsxs(Trans, { children: ["Have a code?", ' ', _jsx(InlineLinkText, __assign({ label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Enter code"], ["Enter code"])))) }, createStaticClick(function () {
                                    dispatch({
                                        type: 'setStep',
                                        step: 'token',
                                    });
                                }), { children: "Click here." }))] }) })] })), state.step === 'token' ? (_jsxs(_Fragment, { children: [_jsx(TokenField, { value: state.token, onChangeText: function (token) {
                            dispatch({
                                type: 'setToken',
                                value: token,
                            });
                        }, onSubmitEditing: handleConfirmEmail }), state.error && _jsx(Admonition, { type: "error", children: state.error }), _jsxs(Button, { label: _(msg({
                            message: "Verify code",
                            context: "action",
                            comment: "Button text and accessibility label for action to verify the user's email address using the code entered",
                        })), size: "large", variant: "solid", color: "primary", onPress: handleConfirmEmail, disabled: !state.token ||
                            state.token.length !== 11 ||
                            state.mutationStatus === 'pending', children: [_jsx(ButtonText, { children: _jsx(Trans, { context: "action", comment: "Button text and accessibility label for action to verify the user's email address using the code entered", children: "Verify code" }) }), state.mutationStatus === 'pending' && _jsx(ButtonIcon, { icon: Loader })] }), _jsx(Divider, {}), _jsx(Text, { style: [a.text_sm, a.leading_snug, t.atoms.text_contrast_medium], children: _jsxs(Trans, { children: ["Don't have a code or need a new one?", ' ', _jsx(InlineLinkText, __assign({ label: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Click here to restart the verification process."], ["Click here to restart the verification process."])))) }, createStaticClick(function () {
                                    dispatch({
                                        type: 'setStep',
                                        step: 'email',
                                    });
                                }), { children: "Click here." }))] }) })] })) : null] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7;
