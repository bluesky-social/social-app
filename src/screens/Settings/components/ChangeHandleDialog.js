var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
import { useCallback, useMemo, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LayoutAnimationConfig, LinearTransition, SlideInLeft, SlideInRight, SlideOutLeft, SlideOutRight, } from 'react-native-reanimated';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { HITSLOP_10, urls } from '#/lib/constants';
import { cleanError } from '#/lib/strings/errors';
import { createFullHandle, validateServiceHandle } from '#/lib/strings/handles';
import { sanitizeHandle } from '#/lib/strings/handles';
import { useFetchDid, useUpdateHandleMutation } from '#/state/queries/handle';
import { RQKEY as RQKEY_PROFILE } from '#/state/queries/profile';
import { useServiceQuery } from '#/state/queries/service';
import { useCurrentAccountProfile } from '#/state/queries/useCurrentAccountProfile';
import { useAgent, useSession } from '#/state/session';
import { ErrorScreen } from '#/view/com/util/error/ErrorScreen';
import { atoms as a, native, useBreakpoints, useTheme } from '#/alf';
import { Admonition } from '#/components/Admonition';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import * as SegmentedControl from '#/components/forms/SegmentedControl';
import * as TextField from '#/components/forms/TextField';
import { ArrowLeft_Stroke2_Corner0_Rounded as ArrowLeftIcon, ArrowRight_Stroke2_Corner0_Rounded as ArrowRightIcon, } from '#/components/icons/Arrow';
import { At_Stroke2_Corner0_Rounded as AtIcon } from '#/components/icons/At';
import { CheckThick_Stroke2_Corner0_Rounded as CheckIcon } from '#/components/icons/Check';
import { SquareBehindSquare4_Stroke2_Corner0_Rounded as CopyIcon } from '#/components/icons/SquareBehindSquare4';
import { InlineLinkText } from '#/components/Link';
import { Loader } from '#/components/Loader';
import { Text } from '#/components/Typography';
import { useSimpleVerificationState } from '#/components/verification';
import { CopyButton } from './CopyButton';
export function ChangeHandleDialog(_a) {
    var control = _a.control;
    var height = useWindowDimensions().height;
    return (_jsx(Dialog.Outer, { control: control, nativeOptions: { minHeight: height }, children: _jsx(ChangeHandleDialogInner, {}) }));
}
function ChangeHandleDialogInner() {
    var control = Dialog.useDialogContext();
    var _ = useLingui()._;
    var agent = useAgent();
    var _a = useServiceQuery(agent.serviceUrl.toString()), serviceInfo = _a.data, serviceInfoError = _a.error, refetch = _a.refetch;
    var _b = useState('provided-handle'), page = _b[0], setPage = _b[1];
    var cancelButton = useCallback(function () { return (_jsx(Button, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Cancel"], ["Cancel"])))), onPress: function () { return control.close(); }, size: "small", color: "primary", variant: "ghost", style: [a.rounded_full], children: _jsx(ButtonText, { style: [a.text_md], children: _jsx(Trans, { children: "Cancel" }) }) })); }, [control, _]);
    return (_jsx(Dialog.ScrollableInner, { label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Change Handle"], ["Change Handle"])))), header: _jsx(Dialog.Header, { renderLeft: cancelButton, children: _jsx(Dialog.HeaderText, { children: _jsx(Trans, { children: "Change Handle" }) }) }), contentContainerStyle: [a.pt_0, a.px_0], children: _jsx(View, { style: [a.flex_1, a.pt_lg, a.px_xl], children: serviceInfoError ? (_jsx(ErrorScreen, { title: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Oops!"], ["Oops!"])))), message: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["There was an issue fetching your service info"], ["There was an issue fetching your service info"])))), details: cleanError(serviceInfoError), onPressTryAgain: refetch })) : serviceInfo ? (_jsx(LayoutAnimationConfig, { skipEntering: true, skipExiting: true, children: page === 'provided-handle' ? (_jsx(Animated.View, { entering: native(SlideInLeft), exiting: native(SlideOutLeft), children: _jsx(ProvidedHandlePage, { serviceInfo: serviceInfo, goToOwnHandle: function () { return setPage('own-handle'); } }) }, page)) : (_jsx(Animated.View, { entering: native(SlideInRight), exiting: native(SlideOutRight), children: _jsx(OwnHandlePage, { goToServiceHandle: function () { return setPage('provided-handle'); } }) }, page)) })) : (_jsx(View, { style: [a.flex_1, a.justify_center, a.align_center, a.py_4xl], children: _jsx(Loader, { size: "xl" }) })) }) }));
}
function ProvidedHandlePage(_a) {
    var serviceInfo = _a.serviceInfo, goToOwnHandle = _a.goToOwnHandle;
    var _ = useLingui()._;
    var _b = useState(''), subdomain = _b[0], setSubdomain = _b[1];
    var agent = useAgent();
    var control = Dialog.useDialogContext();
    var currentAccount = useSession().currentAccount;
    var queryClient = useQueryClient();
    var profile = useCurrentAccountProfile();
    var verification = useSimpleVerificationState({
        profile: profile,
    });
    var _c = useUpdateHandleMutation({
        onSuccess: function () {
            if (currentAccount) {
                queryClient.invalidateQueries({
                    queryKey: RQKEY_PROFILE(currentAccount.did),
                });
            }
            agent.resumeSession(agent.session).then(function () { return control.close(); });
        },
    }), changeHandle = _c.mutate, isPending = _c.isPending, error = _c.error, isSuccess = _c.isSuccess;
    var host = serviceInfo.availableUserDomains[0];
    var validation = useMemo(function () { return validateServiceHandle(subdomain, host); }, [subdomain, host]);
    var isInvalid = !validation.handleChars ||
        !validation.hyphenStartOrEnd ||
        !validation.totalLength;
    return (_jsx(LayoutAnimationConfig, { skipEntering: true, children: _jsxs(View, { style: [a.flex_1, a.gap_md], children: [isSuccess && (_jsx(Animated.View, { entering: FadeIn, exiting: FadeOut, children: _jsx(SuccessMessage, { text: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Handle changed!"], ["Handle changed!"])))) }) })), error && (_jsx(Animated.View, { entering: FadeIn, exiting: FadeOut, children: _jsx(ChangeHandleError, { error: error }) })), _jsxs(Animated.View, { layout: native(LinearTransition), style: [a.flex_1, a.gap_md], children: [verification.isVerified && verification.role === 'default' && (_jsx(Admonition, { type: "error", children: _jsxs(Trans, { children: ["You are verified. You will lose your verification status if you change your handle.", ' ', _jsx(InlineLinkText, { label: _(msg({
                                            message: "Learn more",
                                            context: "english-only-resource",
                                        })), to: urls.website.blog.initialVerificationAnnouncement, children: _jsx(Trans, { context: "english-only-resource", children: "Learn more." }) })] }) })), _jsxs(View, { children: [_jsx(TextField.LabelText, { children: _jsx(Trans, { children: "New handle" }) }), _jsxs(TextField.Root, { isInvalid: isInvalid, children: [_jsx(TextField.Icon, { icon: AtIcon }), _jsx(Dialog.Input, { editable: !isPending, defaultValue: subdomain, onChangeText: function (text) { return setSubdomain(text); }, label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["New handle"], ["New handle"])))), placeholder: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["e.g. alice"], ["e.g. alice"])))), autoCapitalize: "none", autoCorrect: false }), _jsx(TextField.SuffixText, { label: host, style: [{ maxWidth: '40%' }], children: host })] })] }), _jsx(Text, { children: _jsxs(Trans, { children: ["Your full handle will be", ' ', _jsxs(Text, { style: [a.font_semi_bold], children: ["@", createFullHandle(subdomain, host)] })] }) }), _jsx(Button, { label: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Save new handle"], ["Save new handle"])))), variant: "solid", size: "large", color: validation.overall ? 'primary' : 'secondary', disabled: !validation.overall, onPress: function () {
                                if (validation.overall) {
                                    changeHandle({ handle: createFullHandle(subdomain, host) });
                                }
                            }, children: isPending ? (_jsx(ButtonIcon, { icon: Loader })) : (_jsx(ButtonText, { children: _jsx(Trans, { children: "Save" }) })) }), _jsx(Text, { style: [a.leading_snug], children: _jsxs(Trans, { children: ["If you have your own domain, you can use that as your handle. This lets you self-verify your identity.", ' ', _jsx(InlineLinkText, { label: _(msg({
                                            message: "Learn more",
                                            context: "english-only-resource",
                                        })), to: "https://bsky.social/about/blog/4-28-2023-domain-handle-tutorial", style: [a.font_semi_bold], disableMismatchWarning: true, children: "Learn more here." })] }) }), _jsxs(Button, { label: _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["I have my own domain"], ["I have my own domain"])))), variant: "outline", color: "primary", size: "large", onPress: goToOwnHandle, children: [_jsx(ButtonText, { children: _jsx(Trans, { children: "I have my own domain" }) }), _jsx(ButtonIcon, { icon: ArrowRightIcon, position: "right" })] })] })] }) }));
}
function OwnHandlePage(_a) {
    var _this = this;
    var _b, _c;
    var goToServiceHandle = _a.goToServiceHandle;
    var _ = useLingui()._;
    var t = useTheme();
    var currentAccount = useSession().currentAccount;
    var _d = useState(true), dnsPanel = _d[0], setDNSPanel = _d[1];
    var _e = useState(''), domain = _e[0], setDomain = _e[1];
    var agent = useAgent();
    var control = Dialog.useDialogContext();
    var fetchDid = useFetchDid();
    var queryClient = useQueryClient();
    var _f = useUpdateHandleMutation({
        onSuccess: function () {
            if (currentAccount) {
                queryClient.invalidateQueries({
                    queryKey: RQKEY_PROFILE(currentAccount.did),
                });
            }
            agent.resumeSession(agent.session).then(function () { return control.close(); });
        },
    }), changeHandle = _f.mutate, isPending = _f.isPending, error = _f.error, isSuccess = _f.isSuccess;
    var _g = useMutation({
        mutationKey: ['verify-handle', domain],
        mutationFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var did;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetchDid(domain)];
                    case 1:
                        did = _a.sent();
                        if (did !== (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did)) {
                            throw new DidMismatchError(did);
                        }
                        return [2 /*return*/, true];
                }
            });
        }); },
    }), verify = _g.mutate, isVerifyPending = _g.isPending, isVerified = _g.isSuccess, verifyError = _g.error, resetVerification = _g.reset;
    return (_jsxs(View, { style: [a.flex_1, a.gap_lg], children: [isSuccess && (_jsx(Animated.View, { entering: FadeIn, exiting: FadeOut, children: _jsx(SuccessMessage, { text: _(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["Handle changed!"], ["Handle changed!"])))) }) })), error && (_jsx(Animated.View, { entering: FadeIn, exiting: FadeOut, children: _jsx(ChangeHandleError, { error: error }) })), verifyError && (_jsx(Animated.View, { entering: FadeIn, exiting: FadeOut, children: _jsx(Admonition, { type: "error", children: verifyError instanceof DidMismatchError ? (_jsxs(Trans, { children: ["Wrong DID returned from server. Received: ", verifyError.did] })) : (_jsx(Trans, { children: "Failed to verify handle. Please try again." })) }) })), _jsxs(Animated.View, { layout: native(LinearTransition), style: [a.flex_1, a.gap_md, a.overflow_hidden], children: [_jsxs(View, { children: [_jsx(TextField.LabelText, { children: _jsx(Trans, { children: "Enter the domain you want to use" }) }), _jsxs(TextField.Root, { children: [_jsx(TextField.Icon, { icon: AtIcon }), _jsx(Dialog.Input, { label: _(msg(templateObject_11 || (templateObject_11 = __makeTemplateObject(["New handle"], ["New handle"])))), placeholder: _(msg(templateObject_12 || (templateObject_12 = __makeTemplateObject(["e.g. alice.com"], ["e.g. alice.com"])))), editable: !isPending, defaultValue: domain, onChangeText: function (text) {
                                            setDomain(text);
                                            resetVerification();
                                        }, autoCapitalize: "none", autoCorrect: false })] })] }), _jsxs(SegmentedControl.Root, { label: _(msg(templateObject_13 || (templateObject_13 = __makeTemplateObject(["Choose domain verification method"], ["Choose domain verification method"])))), type: "tabs", value: dnsPanel ? 'dns' : 'file', onChange: function (values) { return setDNSPanel(values === 'dns'); }, children: [_jsx(SegmentedControl.Item, { value: "dns", label: _(msg(templateObject_14 || (templateObject_14 = __makeTemplateObject(["DNS Panel"], ["DNS Panel"])))), children: _jsx(SegmentedControl.ItemText, { children: _jsx(Trans, { children: "DNS Panel" }) }) }), _jsx(SegmentedControl.Item, { value: "file", label: _(msg(templateObject_15 || (templateObject_15 = __makeTemplateObject(["No DNS Panel"], ["No DNS Panel"])))), children: _jsx(SegmentedControl.ItemText, { children: _jsx(Trans, { children: "No DNS Panel" }) }) })] }), dnsPanel ? (_jsxs(_Fragment, { children: [_jsx(Text, { children: _jsx(Trans, { children: "Add the following DNS record to your domain:" }) }), _jsxs(View, { style: [
                                    t.atoms.bg_contrast_25,
                                    a.rounded_sm,
                                    a.p_md,
                                    a.border,
                                    t.atoms.border_contrast_low,
                                ], children: [_jsx(Text, { style: [t.atoms.text_contrast_medium], children: _jsx(Trans, { children: "Host:" }) }), _jsx(View, { style: [a.py_xs], children: _jsxs(CopyButton, { color: "secondary", value: "_atproto", label: _(msg(templateObject_16 || (templateObject_16 = __makeTemplateObject(["Copy host"], ["Copy host"])))), style: [a.bg_transparent], hoverStyle: [a.bg_transparent], hitSlop: HITSLOP_10, children: [_jsx(Text, { style: [a.text_md, a.flex_1], children: "_atproto" }), _jsx(ButtonIcon, { icon: CopyIcon })] }) }), _jsx(Text, { style: [a.mt_xs, t.atoms.text_contrast_medium], children: _jsx(Trans, { children: "Type:" }) }), _jsx(View, { style: [a.py_xs], children: _jsx(Text, { style: [a.text_md], children: "TXT" }) }), _jsx(Text, { style: [a.mt_xs, t.atoms.text_contrast_medium], children: _jsx(Trans, { children: "Value:" }) }), _jsx(View, { style: [a.py_xs], children: _jsxs(CopyButton, { color: "secondary", value: 'did=' + (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did), label: _(msg(templateObject_17 || (templateObject_17 = __makeTemplateObject(["Copy TXT record value"], ["Copy TXT record value"])))), style: [a.bg_transparent], hoverStyle: [a.bg_transparent], hitSlop: HITSLOP_10, children: [_jsxs(Text, { style: [a.text_md, a.flex_1], children: ["did=", currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did] }), _jsx(ButtonIcon, { icon: CopyIcon })] }) })] }), _jsx(Text, { children: _jsx(Trans, { children: "This should create a domain record at:" }) }), _jsx(View, { style: [
                                    t.atoms.bg_contrast_25,
                                    a.rounded_sm,
                                    a.p_md,
                                    a.border,
                                    t.atoms.border_contrast_low,
                                ], children: _jsxs(Text, { style: [a.text_md], children: ["_atproto.", domain] }) })] })) : (_jsxs(_Fragment, { children: [_jsx(Text, { children: _jsx(Trans, { children: "Upload a text file to:" }) }), _jsx(View, { style: [
                                    t.atoms.bg_contrast_25,
                                    a.rounded_sm,
                                    a.p_md,
                                    a.border,
                                    t.atoms.border_contrast_low,
                                ], children: _jsxs(Text, { style: [a.text_md], children: ["https://", domain, "/.well-known/atproto-did"] }) }), _jsx(Text, { children: _jsx(Trans, { children: "That contains the following:" }) }), _jsxs(CopyButton, { value: (_b = currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did) !== null && _b !== void 0 ? _b : '', label: _(msg(templateObject_18 || (templateObject_18 = __makeTemplateObject(["Copy DID"], ["Copy DID"])))), size: "large", shape: "rectangular", color: "secondary", style: [
                                    a.px_md,
                                    a.border,
                                    t.atoms.border_contrast_low,
                                    t.atoms.bg_contrast_25,
                                ], children: [_jsx(Text, { style: [a.text_md, a.flex_1], children: currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did }), _jsx(ButtonIcon, { icon: CopyIcon })] })] }))] }), isVerified && (_jsx(Animated.View, { entering: FadeIn, exiting: FadeOut, layout: native(LinearTransition), children: _jsx(SuccessMessage, { text: _(msg(templateObject_19 || (templateObject_19 = __makeTemplateObject(["Domain verified!"], ["Domain verified!"])))) }) })), _jsxs(Animated.View, { layout: native(LinearTransition), children: [((_c = currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.handle) === null || _c === void 0 ? void 0 : _c.endsWith('.bsky.social')) && (_jsx(Admonition, { type: "info", style: [a.mb_md], children: _jsxs(Trans, { children: ["Your current handle", ' ', _jsx(Text, { style: [a.font_semi_bold], children: sanitizeHandle((currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.handle) || '', '@') }), ' ', "will automatically remain reserved for you. You can switch back to it at any time from this account."] }) })), _jsx(Button, { label: isVerified
                            ? _(msg(templateObject_20 || (templateObject_20 = __makeTemplateObject(["Update to ", ""], ["Update to ", ""])), domain))
                            : dnsPanel
                                ? _(msg(templateObject_21 || (templateObject_21 = __makeTemplateObject(["Verify DNS Record"], ["Verify DNS Record"]))))
                                : _(msg(templateObject_22 || (templateObject_22 = __makeTemplateObject(["Verify Text File"], ["Verify Text File"])))), variant: "solid", size: "large", color: "primary", disabled: domain.trim().length === 0, onPress: function () {
                            if (isVerified) {
                                changeHandle({ handle: domain });
                            }
                            else {
                                verify();
                            }
                        }, children: isPending || isVerifyPending ? (_jsx(ButtonIcon, { icon: Loader })) : (_jsx(ButtonText, { children: isVerified ? (_jsxs(Trans, { children: ["Update to ", domain] })) : dnsPanel ? (_jsx(Trans, { children: "Verify DNS Record" })) : (_jsx(Trans, { children: "Verify Text File" })) })) }), _jsxs(Button, { label: _(msg(templateObject_23 || (templateObject_23 = __makeTemplateObject(["Use default provider"], ["Use default provider"])))), accessibilityHint: _(msg(templateObject_24 || (templateObject_24 = __makeTemplateObject(["Returns to previous page"], ["Returns to previous page"])))), onPress: goToServiceHandle, variant: "outline", color: "secondary", size: "large", style: [a.mt_sm], children: [_jsx(ButtonIcon, { icon: ArrowLeftIcon, position: "left" }), _jsx(ButtonText, { children: _jsx(Trans, { children: "Nevermind, create a handle for me" }) })] })] })] }));
}
var DidMismatchError = /** @class */ (function (_super) {
    __extends(DidMismatchError, _super);
    function DidMismatchError(did) {
        var _this = _super.call(this, 'DID mismatch') || this;
        _this.name = 'DidMismatchError';
        _this.did = did;
        return _this;
    }
    return DidMismatchError;
}(Error));
function ChangeHandleError(_a) {
    var error = _a.error;
    var _ = useLingui()._;
    var message = _(msg(templateObject_25 || (templateObject_25 = __makeTemplateObject(["Failed to change handle. Please try again."], ["Failed to change handle. Please try again."]))));
    if (error instanceof Error) {
        if (error.message.startsWith('Handle already taken')) {
            message = _(msg(templateObject_26 || (templateObject_26 = __makeTemplateObject(["Handle already taken. Please try a different one."], ["Handle already taken. Please try a different one."]))));
        }
        else if (error.message === 'Reserved handle') {
            message = _(msg(templateObject_27 || (templateObject_27 = __makeTemplateObject(["This handle is reserved. Please try a different one."], ["This handle is reserved. Please try a different one."]))));
        }
        else if (error.message === 'Handle too long') {
            message = _(msg(templateObject_28 || (templateObject_28 = __makeTemplateObject(["Handle too long. Please try a shorter one."], ["Handle too long. Please try a shorter one."]))));
        }
        else if (error.message === 'Input/handle must be a valid handle') {
            message = _(msg(templateObject_29 || (templateObject_29 = __makeTemplateObject(["Invalid handle. Please try a different one."], ["Invalid handle. Please try a different one."]))));
        }
        else if (error.message === 'Rate Limit Exceeded') {
            message = _(msg(templateObject_30 || (templateObject_30 = __makeTemplateObject(["Rate limit exceeded \u2013 you've tried to change your handle too many times in a short period. Please wait a minute before trying again."], ["Rate limit exceeded \u2013 you've tried to change your handle too many times in a short period. Please wait a minute before trying again."]))));
        }
    }
    return _jsx(Admonition, { type: "error", children: message });
}
function SuccessMessage(_a) {
    var text = _a.text;
    var gtMobile = useBreakpoints().gtMobile;
    var t = useTheme();
    return (_jsxs(View, { style: [
            a.flex_1,
            a.gap_md,
            a.flex_row,
            a.justify_center,
            a.align_center,
            gtMobile ? a.px_md : a.px_sm,
            a.py_xs,
            t.atoms.border_contrast_low,
        ], children: [_jsx(View, { style: [
                    { height: 20, width: 20 },
                    a.rounded_full,
                    a.align_center,
                    a.justify_center,
                    { backgroundColor: t.palette.positive_500 },
                ], children: _jsx(CheckIcon, { fill: t.palette.white, size: "xs" }) }), _jsx(Text, { style: [a.text_md], children: text })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15, templateObject_16, templateObject_17, templateObject_18, templateObject_19, templateObject_20, templateObject_21, templateObject_22, templateObject_23, templateObject_24, templateObject_25, templateObject_26, templateObject_27, templateObject_28, templateObject_29, templateObject_30;
