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
import { useCallback, useRef, useState } from 'react';
import { Keyboard, View } from 'react-native';
import { ComAtprotoServerCreateSession, } from '@atproto/api';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useRequestNotificationsPermission } from '#/lib/notifications/notifications';
import { cleanError, isNetworkError } from '#/lib/strings/errors';
import { createFullHandle } from '#/lib/strings/handles';
import { logger } from '#/logger';
import { useSetHasCheckedForStarterPack } from '#/state/preferences/used-starter-packs';
import { useSessionApi } from '#/state/session';
import { useLoggedOutViewControls } from '#/state/shell/logged-out';
import { atoms as a, ios, useTheme, web } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { FormError } from '#/components/forms/FormError';
import { HostingProvider } from '#/components/forms/HostingProvider';
import * as TextField from '#/components/forms/TextField';
import { At_Stroke2_Corner0_Rounded as At } from '#/components/icons/At';
import { Lock_Stroke2_Corner0_Rounded as Lock } from '#/components/icons/Lock';
import { Ticket_Stroke2_Corner0_Rounded as Ticket } from '#/components/icons/Ticket';
import { Loader } from '#/components/Loader';
import { Text } from '#/components/Typography';
import { IS_IOS, IS_WEB } from '#/env';
import { FormContainer } from './FormContainer';
export var LoginForm = function (_a) {
    var error = _a.error, serviceUrl = _a.serviceUrl, serviceDescription = _a.serviceDescription, initialHandle = _a.initialHandle, setError = _a.setError, setServiceUrl = _a.setServiceUrl, onPressRetryConnect = _a.onPressRetryConnect, onPressBack = _a.onPressBack, onPressForgotPassword = _a.onPressForgotPassword, onAttemptSuccess = _a.onAttemptSuccess, onAttemptFailed = _a.onAttemptFailed;
    var t = useTheme();
    var _b = useState(false), isProcessing = _b[0], setIsProcessing = _b[1];
    var _c = useState('none'), errorField = _c[0], setErrorField = _c[1];
    var _d = useState(false), isAuthFactorTokenNeeded = _d[0], setIsAuthFactorTokenNeeded = _d[1];
    var identifierValueRef = useRef(initialHandle || '');
    var passwordValueRef = useRef('');
    var _e = useState(''), authFactorToken = _e[0], setAuthFactorToken = _e[1];
    var identifierRef = useRef(null);
    var passwordRef = useRef(null);
    var hasFocusedOnce = useRef(false);
    var _ = useLingui()._;
    var login = useSessionApi().login;
    var requestNotificationsPermission = useRequestNotificationsPermission();
    var setShowLoggedOut = useLoggedOutViewControls().setShowLoggedOut;
    var setHasCheckedForStarterPack = useSetHasCheckedForStarterPack();
    var onPressSelectService = useCallback(function () {
        Keyboard.dismiss();
    }, []);
    var onPressNext = function () { return __awaiter(void 0, void 0, void 0, function () {
        var identifier, password, fullIdent, matched, _i, _a, domain, e_1, errMsg;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (isProcessing)
                        return [2 /*return*/];
                    Keyboard.dismiss();
                    setError('');
                    setErrorField('none');
                    identifier = identifierValueRef.current.toLowerCase().trim();
                    password = passwordValueRef.current;
                    if (!identifier) {
                        setError(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Please enter your username"], ["Please enter your username"])))));
                        setErrorField('identifier');
                        return [2 /*return*/];
                    }
                    if (!password) {
                        setError(_(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Please enter your password"], ["Please enter your password"])))));
                        setErrorField('password');
                        return [2 /*return*/];
                    }
                    setIsProcessing(true);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    fullIdent = identifier;
                    if (!identifier.includes('@') && // not an email
                        !identifier.includes('.') && // not a domain
                        serviceDescription &&
                        serviceDescription.availableUserDomains.length > 0) {
                        matched = false;
                        for (_i = 0, _a = serviceDescription.availableUserDomains; _i < _a.length; _i++) {
                            domain = _a[_i];
                            if (fullIdent.endsWith(domain)) {
                                matched = true;
                            }
                        }
                        if (!matched) {
                            fullIdent = createFullHandle(identifier, serviceDescription.availableUserDomains[0]);
                        }
                    }
                    // TODO remove double login
                    return [4 /*yield*/, login({
                            service: serviceUrl,
                            identifier: fullIdent,
                            password: password,
                            authFactorToken: authFactorToken.trim(),
                        }, 'LoginForm')];
                case 2:
                    // TODO remove double login
                    _b.sent();
                    onAttemptSuccess();
                    setShowLoggedOut(false);
                    setHasCheckedForStarterPack(true);
                    requestNotificationsPermission('Login');
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _b.sent();
                    errMsg = e_1.toString();
                    setIsProcessing(false);
                    if (e_1 instanceof ComAtprotoServerCreateSession.AuthFactorTokenRequiredError) {
                        setIsAuthFactorTokenNeeded(true);
                    }
                    else {
                        onAttemptFailed();
                        if (errMsg.includes('Token is invalid')) {
                            logger.debug('Failed to login due to invalid 2fa token', {
                                error: errMsg,
                            });
                            setError(_(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Invalid 2FA confirmation code."], ["Invalid 2FA confirmation code."])))));
                            setErrorField('2fa');
                        }
                        else if (errMsg.includes('Authentication Required') ||
                            errMsg.includes('Invalid identifier or password')) {
                            logger.debug('Failed to login due to invalid credentials', {
                                error: errMsg,
                            });
                            setError(_(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Incorrect username or password"], ["Incorrect username or password"])))));
                        }
                        else if (isNetworkError(e_1)) {
                            logger.warn('Failed to login due to network error', { error: errMsg });
                            setError(_(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Unable to contact your service. Please check your Internet connection."], ["Unable to contact your service. Please check your Internet connection."])))));
                        }
                        else {
                            logger.warn('Failed to login', { error: errMsg });
                            setError(cleanError(errMsg));
                        }
                    }
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    return (_jsxs(FormContainer, { testID: "loginForm", titleText: _jsx(Trans, { children: "Sign in" }), children: [_jsxs(View, { children: [_jsx(TextField.LabelText, { children: _jsx(Trans, { children: "Hosting provider" }) }), _jsx(HostingProvider, { serviceUrl: serviceUrl, onSelectServiceUrl: setServiceUrl, onOpenDialog: onPressSelectService })] }), _jsxs(View, { children: [_jsx(TextField.LabelText, { children: _jsx(Trans, { children: "Account" }) }), _jsxs(View, { style: [a.gap_sm], children: [_jsxs(TextField.Root, { isInvalid: errorField === 'identifier', children: [_jsx(TextField.Icon, { icon: At }), _jsx(TextField.Input, { testID: "loginUsernameInput", inputRef: identifierRef, label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Username or email address"], ["Username or email address"])))), autoCapitalize: "none", autoFocus: !IS_IOS, autoCorrect: false, autoComplete: "username", returnKeyType: "next", textContentType: "username", defaultValue: initialHandle || '', onChangeText: function (v) {
                                            identifierValueRef.current = v;
                                            if (errorField)
                                                setErrorField('none');
                                        }, onSubmitEditing: function () {
                                            var _a;
                                            (_a = passwordRef.current) === null || _a === void 0 ? void 0 : _a.focus();
                                        }, blurOnSubmit: false, editable: !isProcessing, accessibilityHint: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Enter the username or email address you used when you created your account"], ["Enter the username or email address you used when you created your account"])))) })] }), _jsxs(TextField.Root, { isInvalid: errorField === 'password', children: [_jsx(TextField.Icon, { icon: Lock }), _jsx(TextField.Input, { testID: "loginPasswordInput", inputRef: passwordRef, label: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Password"], ["Password"])))), autoCapitalize: "none", autoCorrect: false, autoComplete: "current-password", returnKeyType: "done", enablesReturnKeyAutomatically: true, secureTextEntry: true, clearButtonMode: "while-editing", onChangeText: function (v) {
                                            passwordValueRef.current = v;
                                            if (errorField)
                                                setErrorField('none');
                                        }, onSubmitEditing: onPressNext, blurOnSubmit: false, editable: !isProcessing, accessibilityHint: _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Enter your password"], ["Enter your password"])))), onLayout: ios(function () {
                                            var _a;
                                            if (hasFocusedOnce.current)
                                                return;
                                            hasFocusedOnce.current = true;
                                            // kinda dumb, but if we use `autoFocus` to focus
                                            // the username input, it happens before the password
                                            // input gets rendered. this breaks the password autofill
                                            // on iOS (it only does the username part). delaying
                                            // it until both inputs are rendered fixes the autofill -sfn
                                            (_a = identifierRef.current) === null || _a === void 0 ? void 0 : _a.focus();
                                        }) }), _jsx(Button, { testID: "forgotPasswordButton", onPress: onPressForgotPassword, label: _(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["Forgot password?"], ["Forgot password?"])))), accessibilityHint: _(msg(templateObject_11 || (templateObject_11 = __makeTemplateObject(["Opens password reset form"], ["Opens password reset form"])))), variant: "solid", color: "secondary", style: [
                                            a.rounded_sm,
                                            // t.atoms.bg_contrast_100,
                                            { marginLeft: 'auto', left: 6, padding: 6 },
                                            a.z_10,
                                        ], children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Forgot?" }) }) })] })] })] }), isAuthFactorTokenNeeded && (_jsxs(View, { children: [_jsx(TextField.LabelText, { children: _jsx(Trans, { children: "2FA Confirmation" }) }), _jsxs(TextField.Root, { isInvalid: errorField === '2fa', children: [_jsx(TextField.Icon, { icon: Ticket }), _jsx(TextField.Input, { testID: "loginAuthFactorTokenInput", label: _(msg(templateObject_12 || (templateObject_12 = __makeTemplateObject(["Confirmation code"], ["Confirmation code"])))), autoCapitalize: "none", autoFocus: true, autoCorrect: false, autoComplete: "one-time-code", returnKeyType: "done", blurOnSubmit: false, value: authFactorToken, onChangeText: function (text) {
                                    setAuthFactorToken(text);
                                    if (errorField)
                                        setErrorField('none');
                                }, onSubmitEditing: onPressNext, editable: !isProcessing, accessibilityHint: _(msg(templateObject_13 || (templateObject_13 = __makeTemplateObject(["Input the code which has been emailed to you"], ["Input the code which has been emailed to you"])))), style: {
                                    textTransform: authFactorToken === '' ? 'none' : 'uppercase',
                                } })] }), _jsx(Text, { style: [a.text_sm, t.atoms.text_contrast_medium, a.mt_sm], children: _jsx(Trans, { children: "Check your email for a sign in code and enter it here." }) })] })), _jsx(FormError, { error: error }), _jsxs(View, { style: [a.pt_md, web([a.justify_between, a.flex_row])], children: [IS_WEB && (_jsx(Button, { label: _(msg(templateObject_14 || (templateObject_14 = __makeTemplateObject(["Back"], ["Back"])))), color: "secondary", size: "large", onPress: onPressBack, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Back" }) }) })), !serviceDescription && error ? (_jsx(Button, { testID: "loginRetryButton", label: _(msg(templateObject_15 || (templateObject_15 = __makeTemplateObject(["Retry"], ["Retry"])))), accessibilityHint: _(msg(templateObject_16 || (templateObject_16 = __makeTemplateObject(["Retries signing in"], ["Retries signing in"])))), color: "primary_subtle", size: "large", onPress: onPressRetryConnect, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Retry" }) }) })) : !serviceDescription ? (_jsxs(Button, { label: _(msg(templateObject_17 || (templateObject_17 = __makeTemplateObject(["Connecting to service..."], ["Connecting to service..."])))), size: "large", color: "secondary", disabled: true, children: [_jsx(ButtonIcon, { icon: Loader }), _jsx(ButtonText, { children: "Connecting..." })] })) : (_jsxs(Button, { testID: "loginNextButton", label: _(msg(templateObject_18 || (templateObject_18 = __makeTemplateObject(["Sign in"], ["Sign in"])))), accessibilityHint: _(msg(templateObject_19 || (templateObject_19 = __makeTemplateObject(["Navigates to the next screen"], ["Navigates to the next screen"])))), color: "primary", size: "large", onPress: onPressNext, children: [_jsx(ButtonText, { children: _jsx(Trans, { children: "Sign in" }) }), isProcessing && _jsx(ButtonIcon, { icon: Loader })] }))] })] }));
};
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15, templateObject_16, templateObject_17, templateObject_18, templateObject_19;
