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
import { useCallback, useRef, useState } from 'react';
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { DM_SERVICE_HEADERS } from '#/lib/constants';
import { useCleanError } from '#/lib/hooks/useCleanError';
import { sanitizeHandle } from '#/lib/strings/handles';
import { logger } from '#/logger';
import { useAgent, useSession, useSessionApi } from '#/state/session';
import { atoms as a, useTheme, web } from '#/alf';
import { Admonition } from '#/components/Admonition';
import { isValidCode, TokenField, } from '#/components/dialogs/EmailDialog/components/TokenField';
import * as TextField from '#/components/forms/TextField';
import { Envelope_Stroke2_Corner0_Rounded as Envelope } from '#/components/icons/Envelope';
import { Lock_Stroke2_Corner0_Rounded as Lock } from '#/components/icons/Lock';
import { createStaticClick, InlineLinkText } from '#/components/Link';
import { Loader } from '#/components/Loader';
import * as Prompt from '#/components/Prompt';
import * as toast from '#/components/Toast';
import { Span, Text } from '#/components/Typography';
import { resetToTab } from '#/Navigation';
var WHITESPACE_RE = /\s/gu;
var PASSWORD_MIN_LENGTH = 8;
var Step;
(function (Step) {
    Step[Step["SEND_CODE"] = 0] = "SEND_CODE";
    Step[Step["VERIFY_CODE"] = 1] = "VERIFY_CODE";
    Step[Step["CONFIRM_DELETION"] = 2] = "CONFIRM_DELETION";
})(Step || (Step = {}));
var EmailState;
(function (EmailState) {
    EmailState[EmailState["DEFAULT"] = 0] = "DEFAULT";
    EmailState[EmailState["PENDING"] = 1] = "PENDING";
})(EmailState || (EmailState = {}));
function isPasswordValid(password) {
    return password.length >= PASSWORD_MIN_LENGTH;
}
export function DeleteAccountDialog(_a) {
    var control = _a.control, deactivateDialogControl = _a.deactivateDialogControl;
    return (_jsx(Prompt.Outer, { control: control, children: _jsx(DeleteAccountDialogInner, { control: control, deactivateDialogControl: deactivateDialogControl }) }));
}
function DeleteAccountDialogInner(_a) {
    var _this = this;
    var _b, _c;
    var control = _a.control, deactivateDialogControl = _a.deactivateDialogControl;
    var passwordRef = useRef(null);
    var t = useTheme();
    var _ = useLingui()._;
    var cleanError = useCleanError();
    var agent = useAgent();
    var currentAccount = useSession().currentAccount;
    var removeAccount = useSessionApi().removeAccount;
    var _d = useState(EmailState.DEFAULT), emailState = _d[0], setEmailState = _d[1];
    var _e = useState(0), emailSentCount = _e[0], setEmailSentCount = _e[1];
    var _f = useState(Step.SEND_CODE), step = _f[0], setStep = _f[1];
    var _g = useState(''), confirmCode = _g[0], setConfirmCode = _g[1];
    var _h = useState(''), password = _h[0], setPassword = _h[1];
    var _j = useState(''), error = _j[0], setError = _j[1];
    var sendEmail = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var e_1, _a, clean, raw, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (emailState === EmailState.PENDING) {
                        return [2 /*return*/];
                    }
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, 4, 5]);
                    setEmailState(EmailState.PENDING);
                    return [4 /*yield*/, agent.com.atproto.server.requestAccountDelete()];
                case 2:
                    _b.sent();
                    setError('');
                    setEmailSentCount(function (prevCount) { return prevCount + 1; });
                    setStep(Step.VERIFY_CODE);
                    return [3 /*break*/, 5];
                case 3:
                    e_1 = _b.sent();
                    _a = cleanError(e_1), clean = _a.clean, raw = _a.raw;
                    error_1 = clean || raw || e_1;
                    setError(error_1);
                    logger.error(raw || e_1, {
                        message: 'Failed to send account deletion verification email',
                    });
                    return [3 /*break*/, 5];
                case 4:
                    setEmailState(EmailState.DEFAULT);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [agent, cleanError, emailState, setEmailState]);
    var confirmDeletion = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var token, success, e_2, _a, clean, raw, error_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 3, , 4]);
                    setError('');
                    if (!(currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did)) {
                        throw new Error('Invalid did');
                    }
                    token = confirmCode.replace(WHITESPACE_RE, '');
                    return [4 /*yield*/, agent.api.chat.bsky.actor.deleteAccount(undefined, {
                            headers: DM_SERVICE_HEADERS,
                        })];
                case 1:
                    success = (_b.sent()).success;
                    if (!success) {
                        throw new Error('Failed to inform chat service of account deletion');
                    }
                    return [4 /*yield*/, agent.com.atproto.server.deleteAccount({
                            did: currentAccount.did,
                            password: password,
                            token: token,
                        })];
                case 2:
                    _b.sent();
                    control.close(function () {
                        toast.show(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Your account has been deleted, see ya! \u270C\uFE0F"], ["Your account has been deleted, see ya! \u270C\uFE0F"])))));
                        resetToTab('HomeTab');
                        removeAccount(currentAccount);
                    });
                    return [3 /*break*/, 4];
                case 3:
                    e_2 = _b.sent();
                    _a = cleanError(e_2), clean = _a.clean, raw = _a.raw;
                    error_2 = clean || raw || e_2;
                    setError(error_2);
                    logger.error(raw || e_2, {
                        message: 'Failed to delete account',
                    });
                    setConfirmCode('');
                    setPassword('');
                    setStep(Step.VERIFY_CODE);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [
        _,
        agent,
        cleanError,
        confirmCode,
        control,
        currentAccount,
        password,
        removeAccount,
    ]);
    var handleDeactivate = useCallback(function () {
        control.close(function () { return deactivateDialogControl.open(); });
    }, [control, deactivateDialogControl]);
    var handleSendEmail = useCallback(function () {
        void sendEmail();
    }, [sendEmail]);
    var handleSubmitConfirmCode = useCallback(function () {
        var _a;
        (_a = passwordRef.current) === null || _a === void 0 ? void 0 : _a.focus();
    }, []);
    var handleDeleteAccount = useCallback(function () {
        setStep(Step.CONFIRM_DELETION);
    }, [setStep]);
    var handleConfirmDeletion = useCallback(function () {
        void confirmDeletion();
    }, [confirmDeletion]);
    var currentHandle = sanitizeHandle((_b = currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.handle) !== null && _b !== void 0 ? _b : '', '@');
    var currentEmail = (_c = currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.email) !== null && _c !== void 0 ? _c : '(no email)';
    switch (step) {
        case Step.SEND_CODE:
            return (_jsxs(_Fragment, { children: [_jsxs(Prompt.Content, { children: [_jsx(Prompt.TitleText, { children: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Delete account \u201C", "\u201D"], ["Delete account \u201C", "\u201D"])), currentHandle)) }), _jsx(Prompt.DescriptionText, { children: _jsxs(Trans, { children: ["For security reasons, we\u2019ll need to send a confirmation code to your email address", ' ', _jsx(Span, { style: [a.font_semi_bold, t.atoms.text], children: currentEmail }), "."] }) })] }), _jsxs(Prompt.Actions, { children: [_jsx(Prompt.Action, { icon: emailState === EmailState.PENDING ? Loader : Envelope, cta: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Send email"], ["Send email"])))), shouldCloseOnPress: false, onPress: handleSendEmail }), _jsx(Prompt.Cancel, {})] }), error && (_jsx(Admonition, { style: [a.mt_lg], type: "error", children: _jsx(Text, { style: [a.flex_1, a.leading_snug], children: error }) })), _jsx(Admonition, { style: [a.mt_lg], type: "tip", children: _jsxs(Trans, { children: ["You can also", ' ', _jsx(Span, { style: [{ color: t.palette.primary_500 }, web(a.underline)], onPress: handleDeactivate, children: "temporarily deactivate" }), ' ', "your account instead. Your profile, posts, feeds, and lists will no longer be visible to other Bluesky users. You can reactivate your account at any time by logging in."] }) })] }));
        case Step.VERIFY_CODE:
            return (_jsxs(_Fragment, { children: [_jsxs(Prompt.Content, { children: [_jsx(Prompt.TitleText, { children: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Delete account \u201C", "\u201D"], ["Delete account \u201C", "\u201D"])), currentHandle)) }), _jsx(Prompt.DescriptionText, { children: _jsxs(Trans, { children: ["Check", ' ', _jsx(Span, { style: [a.font_semi_bold, t.atoms.text], children: currentEmail }), ' ', "for an email with the confirmation code to enter below:"] }) })] }), _jsxs(View, { style: [a.mb_xs], children: [_jsx(TextField.LabelText, { children: _jsx(Trans, { children: "Confirmation code" }) }), _jsx(TokenField, { value: confirmCode, onChangeText: setConfirmCode, onSubmitEditing: handleSubmitConfirmCode })] }), _jsxs(Text, { style: [
                            a.text_sm,
                            a.leading_snug,
                            a.mb_lg,
                            t.atoms.text_contrast_medium,
                        ], children: [emailSentCount > 1 ? (_jsxs(Trans, { children: ["Email sent!", ' ', _jsx(InlineLinkText, __assign({ label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Resend"], ["Resend"])))) }, createStaticClick(function () {
                                        void handleSendEmail();
                                    }), { children: "Click here to resend." }))] })) : (_jsxs(Trans, { children: ["Don\u2019t see a code?", ' ', _jsx(InlineLinkText, __assign({ label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Resend"], ["Resend"])))) }, createStaticClick(function () {
                                        void handleSendEmail();
                                    }), { children: "Click here to resend." }))] })), ' ', _jsx(Span, { style: { top: 1 }, children: emailState === EmailState.PENDING ? _jsx(Loader, { size: "xs" }) : null })] }), _jsxs(View, { style: [a.mb_xl], children: [_jsx(TextField.LabelText, { children: _jsx(Trans, { children: "Password" }) }), _jsxs(TextField.Root, { children: [_jsx(TextField.Icon, { icon: Lock }), _jsx(TextField.Input, { inputRef: passwordRef, testID: "newPasswordInput", label: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Enter your password"], ["Enter your password"])))), autoCapitalize: "none", autoCorrect: false, returnKeyType: "done", secureTextEntry: true, autoComplete: "off", clearButtonMode: "while-editing", passwordRules: "minlength: ".concat(PASSWORD_MIN_LENGTH, "};"), value: password, onChangeText: setPassword, onSubmitEditing: handleDeleteAccount })] })] }), _jsxs(Prompt.Actions, { children: [_jsx(Prompt.Action, { color: "negative", disabled: !isValidCode(confirmCode) || !isPasswordValid(password), cta: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Delete my account"], ["Delete my account"])))), shouldCloseOnPress: false, onPress: handleDeleteAccount }), _jsx(Prompt.Cancel, {})] }), error && (_jsx(Admonition, { style: [a.mt_lg], type: "error", children: _jsx(Text, { style: [a.flex_1, a.leading_snug], children: error }) }))] }));
        case Step.CONFIRM_DELETION:
            return (_jsxs(_Fragment, { children: [_jsxs(Prompt.Content, { children: [_jsx(Prompt.TitleText, { children: _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Are you really, really sure?"], ["Are you really, really sure?"])))) }), _jsx(Prompt.DescriptionText, { children: _jsxs(Trans, { children: ["This will irreversibly delete your Bluesky account", ' ', _jsx(Span, { style: [a.font_semi_bold, t.atoms.text], children: currentHandle }), ' ', "and all associated data. Note that this will affect any other", ' ', _jsx(InlineLinkText, { label: _(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["Learn more about the AT Protocol."], ["Learn more about the AT Protocol."])))), style: [a.text_md], to: "https://bsky.social/about/faq", children: "AT Protocol" }), ' ', "services you use with this account."] }) })] }), _jsxs(Prompt.Actions, { children: [_jsx(Prompt.Action, { color: "negative", cta: _(msg(templateObject_11 || (templateObject_11 = __makeTemplateObject(["Yes, delete my account"], ["Yes, delete my account"])))), shouldCloseOnPress: false, onPress: handleConfirmDeletion }), _jsx(Prompt.Cancel, {})] })] }));
    }
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11;
