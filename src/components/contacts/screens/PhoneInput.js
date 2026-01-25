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
import { Keyboard, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBskyContactStartPhoneVerification } from '@atproto/api';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useMutation } from '@tanstack/react-query';
import { urls } from '#/lib/constants';
import { getDefaultCountry, } from '#/lib/international-telephone-codes';
import { cleanError, isNetworkError } from '#/lib/strings/errors';
import { logger } from '#/logger';
import { useAgent } from '#/state/session';
import { OnboardingPosition } from '#/screens/Onboarding/Layout';
import { android, atoms as a, platform, tokens, useGutters, useTheme, } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import * as TextField from '#/components/forms/TextField';
import { InternationalPhoneCodeSelect } from '#/components/InternationalPhoneCodeSelect';
import * as Layout from '#/components/Layout';
import { InlineLinkText } from '#/components/Link';
import { Loader } from '#/components/Loader';
import { Text } from '#/components/Typography';
import { useAnalytics } from '#/analytics';
import { useGeolocation } from '#/geolocation';
import { isFindContactsFeatureEnabled } from '../country-allowlist';
import { constructFullPhoneNumber, getCountryCodeFromPastedNumber, processPhoneNumber, } from '../phone-number';
import { useOnPressBackButton } from '../state';
export function PhoneInput(_a) {
    var _this = this;
    var _b;
    var state = _a.state, dispatch = _a.dispatch, context = _a.context, onSkip = _a.onSkip;
    var _ = useLingui()._;
    var ax = useAnalytics();
    var t = useTheme();
    var agent = useAgent();
    var location = useGeolocation();
    var _c = useState(function () { var _a; return (_a = state.phoneCountryCode) !== null && _a !== void 0 ? _a : getDefaultCountry(location); }), countryCode = _c[0], setCountryCode = _c[1];
    var _d = useState((_b = state.phoneNumber) !== null && _b !== void 0 ? _b : ''), phoneNumber = _d[0], setPhoneNumber = _d[1];
    var gutters = useGutters([0, 'wide']);
    var insets = useSafeAreaInsets();
    // for API/generic errors
    var _e = useState(''), error = _e[0], setError = _e[1];
    // for issues with parsing the number
    var _f = useState(''), formatError = _f[0], setFormatError = _f[1];
    var _g = useMutation({
        mutationFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var phoneCountryCode = _b.phoneCountryCode, phoneNumber = _b.phoneNumber;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: 
                    // sends a onetime code to the user's phone number
                    return [4 /*yield*/, agent.app.bsky.contact.startPhoneVerification({
                            phone: constructFullPhoneNumber(phoneCountryCode, phoneNumber),
                        })];
                    case 1:
                        // sends a onetime code to the user's phone number
                        _c.sent();
                        return [2 /*return*/];
                }
            });
        }); },
        onSuccess: function (_data, _a) {
            var phoneCountryCode = _a.phoneCountryCode, phoneNumber = _a.phoneNumber;
            dispatch({
                type: 'SUBMIT_PHONE_NUMBER',
                payload: { phoneCountryCode: phoneCountryCode, phoneNumber: phoneNumber },
            });
            ax.metric('contacts:phone:phoneEntered', { entryPoint: context });
        },
        onMutate: function () {
            Keyboard.dismiss();
            setError('');
            setFormatError('');
        },
        onError: function (err) {
            if (isNetworkError(err)) {
                setError(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["A network error occurred. Please check your internet connection"], ["A network error occurred. Please check your internet connection"])))));
            }
            else if (err instanceof
                AppBskyContactStartPhoneVerification.RateLimitExceededError) {
                setError(_(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Rate limit exceeded. Please try again later."], ["Rate limit exceeded. Please try again later."])))));
            }
            else if (err instanceof AppBskyContactStartPhoneVerification.InvalidPhoneError) {
                setError(_(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["The verification provider was unable to send a code to your phone number. Please check your phone number and try again."], ["The verification provider was unable to send a code to your phone number. Please check your phone number and try again."])))));
            }
            else {
                logger.error('Verify phone number failed', { safeMessage: err });
                setError(_(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["An error occurred. ", ""], ["An error occurred. ", ""])), cleanError(err))));
            }
        },
    }), submit = _g.mutate, isPending = _g.isPending;
    var isFeatureEnabled = isFindContactsFeatureEnabled(countryCode);
    var onSubmitNumber = function () {
        var _a;
        if (!isFeatureEnabled)
            return;
        if (!phoneNumber)
            return;
        var result = processPhoneNumber(phoneNumber, countryCode);
        if (result.valid) {
            setPhoneNumber(result.formatted);
            setCountryCode(result.countryCode);
            if (!isFindContactsFeatureEnabled(result.countryCode))
                return;
            submit({
                phoneCountryCode: result.countryCode,
                phoneNumber: result.formatted,
            });
        }
        else {
            setFormatError((_a = result.reason) !== null && _a !== void 0 ? _a : _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Invalid phone number"], ["Invalid phone number"])))));
        }
    };
    var paddingBottom = Math.max(insets.bottom, tokens.space.xl);
    var onPressBack = useOnPressBackButton();
    return (_jsxs(View, { style: [a.h_full], children: [_jsxs(Layout.Header.Outer, { noBottomBorder: true, children: [_jsx(Layout.Header.BackButton, { onPress: onPressBack }), _jsx(Layout.Header.Content, {}), context === 'Onboarding' ? (_jsx(Button, { size: "small", color: "secondary", variant: "ghost", label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Skip contact sharing and continue to the app"], ["Skip contact sharing and continue to the app"])))), onPress: onSkip, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Skip" }) }) })) : (_jsx(Layout.Header.Slot, {}))] }), _jsxs(Layout.Content, { contentContainerStyle: [gutters, a.pt_sm, a.flex_1], keyboardShouldPersistTaps: "handled", children: [context === 'Onboarding' && _jsx(OnboardingPosition, {}), _jsx(Text, { style: [a.font_bold, a.text_3xl], children: _jsx(Trans, { children: "Verify phone number" }) }), _jsx(Text, { style: [
                            a.text_md,
                            t.atoms.text_contrast_medium,
                            a.leading_snug,
                            a.mt_sm,
                        ], children: _jsx(Trans, { children: "We need to verify your number before we can look for your friends. A verification code will be sent to this number." }) }), _jsxs(View, { style: [a.mt_2xl], children: [_jsx(TextField.LabelText, { children: _jsx(Trans, { children: "Phone number" }) }), _jsxs(View, { style: [a.flex_row, a.gap_sm, a.align_center], children: [_jsx(View, { children: _jsx(InternationalPhoneCodeSelect, { value: countryCode, onChange: function (value) { return setCountryCode(value); } }) }), _jsx(View, { style: [a.flex_1], children: _jsx(TextField.Root, { isInvalid: !!formatError || !isFeatureEnabled, children: _jsx(TextField.Input, { label: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Phone number"], ["Phone number"])))), value: phoneNumber, onChangeText: function (text) {
                                                    if (formatError)
                                                        setFormatError('');
                                                    if (Math.abs(text.length - phoneNumber.length) > 1) {
                                                        // possibly pasted/autocompleted? auto-switch
                                                        // country code if possible
                                                        var result = getCountryCodeFromPastedNumber(text);
                                                        if (result) {
                                                            setCountryCode(result.countryCode);
                                                            setPhoneNumber(result.rest);
                                                            return;
                                                        }
                                                    }
                                                    setPhoneNumber(text);
                                                }, placeholder: null, keyboardType: platform({
                                                    ios: 'number-pad',
                                                    android: 'phone-pad',
                                                }), autoComplete: "tel", returnKeyType: android('next'), onSubmitEditing: onSubmitNumber }) }) })] })] }), !isFeatureEnabled && (_jsx(ErrorText, { children: _jsx(Trans, { children: "Support for this feature in your country has not been enabled yet! Please check back later." }) })), error && _jsx(ErrorText, { children: error }), formatError && _jsx(ErrorText, { children: formatError }), _jsx(View, { style: [a.mt_auto, a.py_xl], children: _jsx(LegalDisclaimer, {}) })] }), _jsx(KeyboardAvoidingView, { behavior: "padding", keyboardVerticalOffset: insets.top - paddingBottom + tokens.space.xl, children: _jsx(View, { style: [gutters, { paddingBottom: paddingBottom }], children: _jsxs(Button, { disabled: !phoneNumber || isPending, label: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Send code"], ["Send code"])))), size: "large", color: "primary", onPress: onSubmitNumber, children: [_jsx(ButtonText, { children: _jsx(Trans, { children: "Send code" }) }), isPending && _jsx(ButtonIcon, { icon: Loader })] }) }) })] }));
}
function LegalDisclaimer() {
    var t = useTheme();
    var _ = useLingui()._;
    var style = [a.text_xs, t.atoms.text_contrast_medium, a.leading_snug];
    return (_jsxs(View, { style: [a.gap_xs], children: [_jsx(Text, { style: [style, a.font_medium], children: _jsx(Trans, { children: "How we use your number:" }) }), _jsxs(Text, { style: style, children: ["\u2022", ' ', _jsx(Trans, { children: "Sent to our phone number verification provider Plivo" })] }), _jsxs(Text, { style: style, children: ["\u2022 ", _jsx(Trans, { children: "Deleted by Plivo after verification" })] }), _jsxs(Text, { style: style, children: ["\u2022", ' ', _jsx(Trans, { children: "Held by Bluesky for 7 days to prevent abuse, then deleted" })] }), _jsxs(Text, { style: style, children: ["\u2022", ' ', _jsx(Trans, { children: "Stored as part of a secure code for matching with others" })] }), _jsx(Text, { style: [style, a.mt_xs], children: _jsxs(Trans, { children: ["By continuing, you consent to this use. You may change your mind any time by visiting settings.", ' ', _jsx(InlineLinkText, { to: urls.website.support.findFriendsPrivacyPolicy, label: _(msg({
                                message: "Learn more about importing contacts",
                                context: "english-only-resource",
                            })), style: [a.text_xs, a.leading_snug], children: _jsx(Trans, { context: "english-only-resource", children: "Learn more" }) })] }) })] }));
}
function ErrorText(_a) {
    var children = _a.children;
    var t = useTheme();
    return (_jsx(Text, { style: [
            a.text_md,
            { color: t.palette.negative_500 },
            a.leading_snug,
            a.mt_md,
        ], children: children }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8;
