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
import { XRPCError } from '@atproto/xrpc';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { validate as validateEmail } from 'email-validator';
import { useCleanError } from '#/lib/hooks/useCleanError';
import { SupportCode, useCreateSupportLink, } from '#/lib/hooks/useCreateSupportLink';
import { useGetTimeAgo } from '#/lib/hooks/useTimeAgo';
import { useTLDs } from '#/lib/hooks/useTLDs';
import { isEmailMaybeInvalid } from '#/lib/strings/email';
import { useLanguagePrefs } from '#/state/preferences';
import { useSession } from '#/state/session';
import { atoms as a, web } from '#/alf';
import { Admonition } from '#/components/Admonition';
import { AgeAssuranceBadge } from '#/components/ageAssurance/AgeAssuranceBadge';
import { KWS_SUPPORTED_LANGS, urls } from '#/components/ageAssurance/const';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { Divider } from '#/components/Divider';
import * as TextField from '#/components/forms/TextField';
import { ShieldCheck_Stroke2_Corner0_Rounded as Shield } from '#/components/icons/Shield';
import { LanguageSelect } from '#/components/LanguageSelect';
import { SimpleInlineLinkText } from '#/components/Link';
import { Loader } from '#/components/Loader';
import { Text } from '#/components/Typography';
import { useAgeAssurance } from '#/ageAssurance';
import { useBeginAgeAssurance } from '#/ageAssurance/useBeginAgeAssurance';
import { useAnalytics } from '#/analytics';
export { useDialogControl } from '#/components/Dialog/context';
export function AgeAssuranceInitDialog(_a) {
    var control = _a.control;
    var _ = useLingui()._;
    return (_jsxs(Dialog.Outer, { control: control, children: [_jsx(Dialog.Handle, {}), _jsxs(Dialog.ScrollableInner, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Begin the age assurance process by completing the fields below."], ["Begin the age assurance process by completing the fields below."])))), style: [
                    web({
                        maxWidth: 400,
                    }),
                ], children: [_jsx(Inner, {}), _jsx(Dialog.Close, {})] })] }));
}
function Inner() {
    var _this = this;
    var _ = useLingui()._;
    var ax = useAnalytics();
    var currentAccount = useSession().currentAccount;
    var langPrefs = useLanguagePrefs();
    var cleanError = useCleanError();
    var close = Dialog.useDialogContext().close;
    var aa = useAgeAssurance();
    var lastInitiatedAt = aa.state.lastInitiatedAt;
    var getTimeAgo = useGetTimeAgo();
    var tlds = useTLDs();
    var createSupportLink = useCreateSupportLink();
    var wasRecentlyInitiated = lastInitiatedAt &&
        new Date(lastInitiatedAt).getTime() > Date.now() - 5 * 60 * 1000; // 5 minutes
    var _a = useState(false), success = _a[0], setSuccess = _a[1];
    var _b = useState((currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.email) || ''), email = _b[0], setEmail = _b[1];
    var _c = useState(''), emailError = _c[0], setEmailError = _c[1];
    var _d = useState(false), languageError = _d[0], setLanguageError = _d[1];
    var _e = useState(false), disabled = _e[0], setDisabled = _e[1];
    var _f = useState(convertToKWSSupportedLanguage(langPrefs.appLanguage)), language = _f[0], setLanguage = _f[1];
    var _g = useState(null), error = _g[0], setError = _g[1];
    var _h = useBeginAgeAssurance(), begin = _h.mutateAsync, isPending = _h.isPending;
    var runEmailValidation = function () {
        if (validateEmail(email)) {
            setEmailError('');
            setDisabled(false);
            if (tlds && isEmailMaybeInvalid(email, tlds)) {
                setEmailError(_(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Please double-check that you have entered your email address correctly."], ["Please double-check that you have entered your email address correctly."])))));
                return { status: 'maybe' };
            }
            return { status: 'valid' };
        }
        setEmailError(_(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Please enter a valid email address."], ["Please enter a valid email address."])))));
        setDisabled(true);
        return { status: 'invalid' };
    };
    var onSubmit = function () { return __awaiter(_this, void 0, void 0, function () {
        var status_1, e_1, error_1, _a, clean, raw;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    setLanguageError(false);
                    ax.metric('ageAssurance:initDialogSubmit', {});
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    status_1 = runEmailValidation().status;
                    if (status_1 === 'invalid')
                        return [2 /*return*/];
                    if (!language) {
                        setLanguageError(true);
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, begin({
                            email: email,
                            language: language,
                        })];
                case 2:
                    _b.sent();
                    setSuccess(true);
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _b.sent();
                    error_1 = _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Something went wrong, please try again"], ["Something went wrong, please try again"]))));
                    if (e_1 instanceof XRPCError) {
                        if (e_1.error === 'InvalidEmail') {
                            error_1 = _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Please enter a valid, non-temporary email address. You may need to access this email in the future."], ["Please enter a valid, non-temporary email address. You may need to access this email in the future."]))));
                            ax.metric('ageAssurance:initDialogError', { code: 'InvalidEmail' });
                        }
                        else if (e_1.error === 'DidTooLong') {
                            error_1 = (_jsx(_Fragment, { children: _jsxs(Trans, { children: ["We're having issues initializing the age assurance process for your account. Please", ' ', _jsx(SimpleInlineLinkText, { to: createSupportLink({ code: SupportCode.AA_DID, email: email }), label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Contact support"], ["Contact support"])))), children: "contact support" }), ' ', "for assistance."] }) }));
                            ax.metric('ageAssurance:initDialogError', { code: 'DidTooLong' });
                        }
                        else {
                            ax.metric('ageAssurance:initDialogError', { code: 'other' });
                        }
                    }
                    else {
                        _a = cleanError(e_1), clean = _a.clean, raw = _a.raw;
                        error_1 = clean || raw || error_1;
                        ax.metric('ageAssurance:initDialogError', { code: 'other' });
                    }
                    setError(error_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    return (_jsx(View, { children: _jsxs(View, { style: [a.align_start], children: [_jsx(AgeAssuranceBadge, {}), _jsx(Text, { style: [a.text_xl, a.font_bold, a.pt_xl, a.pb_md], children: success ? _jsx(Trans, { children: "Success!" }) : _jsx(Trans, { children: "Verify your age" }) }), _jsx(View, { style: [a.pb_xl, a.gap_sm], children: success ? (_jsx(Text, { style: [a.text_sm, a.leading_snug], children: _jsx(Trans, { children: "Please check your email inbox for further instructions. It may take a minute or two to arrive." }) })) : (_jsxs(_Fragment, { children: [_jsx(Text, { style: [a.text_sm, a.leading_snug], children: _jsxs(Trans, { children: ["We have partnered with", ' ', _jsx(SimpleInlineLinkText, { label: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["KWS website"], ["KWS website"])))), to: urls.kwsHome, style: [a.text_sm, a.leading_snug], children: "KWS" }), ' ', "to handle age verification. When you click \"Begin\" below, KWS will email you instructions to complete the verification process. If your email address has already been used to verify your age for another game or service that uses KWS, you won\u2019t need to do it again. When you\u2019re done, you'll be brought back to continue using Bluesky."] }) }), _jsx(Text, { style: [a.text_sm, a.leading_snug], children: _jsx(Trans, { children: "This should only take a few minutes." }) })] })) }), success ? (_jsx(View, { style: [a.w_full], children: _jsx(Button, { label: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Close dialog"], ["Close dialog"])))), size: "large", variant: "solid", color: "secondary", onPress: function () { return close(); }, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Close dialog" }) }) }) })) : (_jsxs(_Fragment, { children: [_jsx(Divider, {}), _jsxs(View, { style: [a.w_full, a.pt_xl, a.gap_lg, a.pb_lg], children: [wasRecentlyInitiated && (_jsx(Admonition, { type: "warning", children: _jsxs(Trans, { children: ["You initiated this flow already,", ' ', getTimeAgo(lastInitiatedAt, new Date(), { format: 'long' }), ' ', "ago. It may take up to 5 minutes for emails to reach your inbox. Please consider waiting a few minutes before trying again."] }) })), _jsxs(View, { children: [_jsx(TextField.LabelText, { children: _jsx(Trans, { children: "Your email" }) }), _jsx(TextField.Root, { isInvalid: !!emailError, children: _jsx(TextField.Input, { label: _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Your email"], ["Your email"])))), placeholder: _(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["Your email"], ["Your email"])))), value: email, onChangeText: setEmail, onFocus: function () { return setEmailError(''); }, onBlur: function () {
                                                    runEmailValidation();
                                                }, returnKeyType: "done", autoCapitalize: "none", autoComplete: "off", autoCorrect: false, onSubmitEditing: onSubmit }) }), emailError ? (_jsx(Admonition, { type: "error", style: [a.mt_sm], children: emailError })) : (_jsx(Admonition, { type: "tip", style: [a.mt_sm], children: _jsx(Trans, { children: "Use your account email address, or another real email address you control, in case KWS or Bluesky needs to contact you." }) }))] }), _jsxs(View, { children: [_jsx(TextField.LabelText, { children: _jsx(Trans, { children: "Your preferred language" }) }), _jsx(LanguageSelect, { label: _(msg(templateObject_11 || (templateObject_11 = __makeTemplateObject(["Preferred language"], ["Preferred language"])))), value: language, onChange: function (value) {
                                                setLanguage(value);
                                                setLanguageError(false);
                                            }, items: KWS_SUPPORTED_LANGS }), languageError && (_jsx(Admonition, { type: "error", style: [a.mt_sm], children: _jsx(Trans, { children: "Please select a language" }) }))] }), error && _jsx(Admonition, { type: "error", children: error }), _jsxs(Button, { disabled: disabled, label: _(msg(templateObject_12 || (templateObject_12 = __makeTemplateObject(["Begin age assurance process"], ["Begin age assurance process"])))), size: "large", variant: "solid", color: "primary", onPress: onSubmit, children: [_jsx(ButtonText, { children: _jsx(Trans, { children: "Begin" }) }), _jsx(ButtonIcon, { icon: isPending ? Loader : Shield, position: "right" })] })] })] }))] }) }));
}
// best-effort mapping of our languages to KWS supported languages
function convertToKWSSupportedLanguage(appLanguage) {
    var _a;
    // `${Enum}` is how you get a type of string union of the enum values (???) -sfn
    switch (appLanguage) {
        // only en is supported
        case 'en-GB':
            return 'en';
        // pt-PT is pt (pt-BR is supported independently)
        case 'pt-PT':
            return 'pt';
        // only chinese (simplified) is supported, map all chinese variants
        case 'zh-Hans-CN':
        case 'zh-Hant-HK':
        case 'zh-Hant-TW':
            return 'zh-Hans';
        default:
            // try and map directly - if undefined, they will have to pick from the dropdown
            return (_a = KWS_SUPPORTED_LANGS.find(function (v) { return v.value === appLanguage; })) === null || _a === void 0 ? void 0 : _a.value;
    }
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12;
