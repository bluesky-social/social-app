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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useRef } from 'react';
import { View } from 'react-native';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import * as EmailValidator from 'email-validator';
import { isEmailMaybeInvalid } from '#/lib/strings/email';
import { logger } from '#/logger';
import { useSignupContext } from '#/screens/Signup/state';
import { Policies } from '#/screens/Signup/StepInfo/Policies';
import { atoms as a, native } from '#/alf';
import * as Admonition from '#/components/Admonition';
import * as Dialog from '#/components/Dialog';
import { DeviceLocationRequestDialog } from '#/components/dialogs/DeviceLocationRequestDialog';
import * as DateField from '#/components/forms/DateField';
import { FormError } from '#/components/forms/FormError';
import { HostingProvider } from '#/components/forms/HostingProvider';
import * as TextField from '#/components/forms/TextField';
import { Envelope_Stroke2_Corner0_Rounded as Envelope } from '#/components/icons/Envelope';
import { Lock_Stroke2_Corner0_Rounded as Lock } from '#/components/icons/Lock';
import { Ticket_Stroke2_Corner0_Rounded as Ticket } from '#/components/icons/Ticket';
import { createStaticClick, SimpleInlineLinkText } from '#/components/Link';
import { Loader } from '#/components/Loader';
import { usePreemptivelyCompleteActivePolicyUpdate } from '#/components/PolicyUpdateOverlay/usePreemptivelyCompleteActivePolicyUpdate';
import * as Toast from '#/components/Toast';
import { isUnderAge, MIN_ACCESS_AGE, useAgeAssuranceRegionConfigWithFallback, } from '#/ageAssurance/util';
import { useAnalytics } from '#/analytics';
import { IS_NATIVE } from '#/env';
import { useDeviceGeolocationApi, useIsDeviceGeolocationGranted, } from '#/geolocation';
import { BackNextButtons } from '../BackNextButtons';
function sanitizeDate(date) {
    if (!date || date.toString() === 'Invalid Date') {
        logger.error("Create account: handled invalid date for birthDate", {
            hasDate: !!date,
        });
        return new Date();
    }
    return date;
}
export function StepInfo(_a) {
    var onPressBack = _a.onPressBack, isServerError = _a.isServerError, refetchServer = _a.refetchServer, isLoadingStarterPack = _a.isLoadingStarterPack;
    var _ = useLingui()._;
    var ax = useAnalytics();
    var _b = useSignupContext(), state = _b.state, dispatch = _b.dispatch;
    var preemptivelyCompleteActivePolicyUpdate = usePreemptivelyCompleteActivePolicyUpdate();
    var inviteCodeValueRef = useRef(state.inviteCode);
    var emailValueRef = useRef(state.email);
    var prevEmailValueRef = useRef(state.email);
    var passwordValueRef = useRef(state.password);
    var emailInputRef = useRef(null);
    var passwordInputRef = useRef(null);
    var birthdateInputRef = useRef(null);
    var aaRegionConfig = useAgeAssuranceRegionConfigWithFallback();
    var setDeviceGeolocation = useDeviceGeolocationApi().setDeviceGeolocation;
    var locationControl = Dialog.useDialogControl();
    var isOverRegionMinAccessAge = state.dateOfBirth
        ? !isUnderAge(state.dateOfBirth.toISOString(), aaRegionConfig.minAccessAge)
        : true;
    var isOverAppMinAccessAge = state.dateOfBirth
        ? !isUnderAge(state.dateOfBirth.toISOString(), MIN_ACCESS_AGE)
        : true;
    var isOverMinAdultAge = state.dateOfBirth
        ? !isUnderAge(state.dateOfBirth.toISOString(), 18)
        : true;
    var isDeviceGeolocationGranted = useIsDeviceGeolocationGranted();
    var _c = React.useState(false), hasWarnedEmail = _c[0], setHasWarnedEmail = _c[1];
    var tldtsRef = React.useRef(undefined);
    React.useEffect(function () {
        // @ts-expect-error - valid path
        import('tldts/dist/index.cjs.min.js').then(function (tldts) {
            tldtsRef.current = tldts;
        });
        // This will get used in the avatar creator a few steps later, so lets preload it now
        // @ts-expect-error - valid path
        import('react-native-view-shot/src/index');
    }, []);
    var onNextPress = function () {
        var _a;
        var inviteCode = inviteCodeValueRef.current;
        var email = emailValueRef.current;
        var emailChanged = prevEmailValueRef.current !== email;
        var password = passwordValueRef.current;
        if (!isOverRegionMinAccessAge) {
            return;
        }
        if (((_a = state.serviceDescription) === null || _a === void 0 ? void 0 : _a.inviteCodeRequired) && !inviteCode) {
            return dispatch({
                type: 'setError',
                value: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Please enter your invite code."], ["Please enter your invite code."])))),
                field: 'invite-code',
            });
        }
        if (!email) {
            return dispatch({
                type: 'setError',
                value: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Please enter your email."], ["Please enter your email."])))),
                field: 'email',
            });
        }
        if (!EmailValidator.validate(email)) {
            return dispatch({
                type: 'setError',
                value: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Your email appears to be invalid."], ["Your email appears to be invalid."])))),
                field: 'email',
            });
        }
        if (emailChanged && tldtsRef.current) {
            if (isEmailMaybeInvalid(email, tldtsRef.current)) {
                prevEmailValueRef.current = email;
                setHasWarnedEmail(true);
                return dispatch({
                    type: 'setError',
                    value: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Please double-check that you have entered your email address correctly."], ["Please double-check that you have entered your email address correctly."])))),
                });
            }
        }
        else if (hasWarnedEmail) {
            setHasWarnedEmail(false);
        }
        prevEmailValueRef.current = email;
        if (!password) {
            return dispatch({
                type: 'setError',
                value: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Please choose your password."], ["Please choose your password."])))),
                field: 'password',
            });
        }
        if (password.length < 8) {
            return dispatch({
                type: 'setError',
                value: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Your password must be at least 8 characters long."], ["Your password must be at least 8 characters long."])))),
                field: 'password',
            });
        }
        preemptivelyCompleteActivePolicyUpdate();
        dispatch({ type: 'setInviteCode', value: inviteCode });
        dispatch({ type: 'setEmail', value: email });
        dispatch({ type: 'setPassword', value: password });
        dispatch({ type: 'next' });
        ax.metric('signup:nextPressed', {
            activeStep: state.activeStep,
        });
    };
    return (_jsxs(_Fragment, { children: [_jsxs(View, { style: [a.gap_md, a.pt_lg], children: [_jsx(FormError, { error: state.error }), _jsx(HostingProvider, { minimal: true, serviceUrl: state.serviceUrl, onSelectServiceUrl: function (v) { return dispatch({ type: 'setServiceUrl', value: v }); } }), state.isLoading || isLoadingStarterPack ? (_jsx(View, { style: [a.align_center], children: _jsx(Loader, { size: "xl" }) })) : state.serviceDescription ? (_jsxs(_Fragment, { children: [state.serviceDescription.inviteCodeRequired && (_jsxs(View, { children: [_jsx(TextField.LabelText, { children: _jsx(Trans, { children: "Invite code" }) }), _jsxs(TextField.Root, { isInvalid: state.errorField === 'invite-code', children: [_jsx(TextField.Icon, { icon: Ticket }), _jsx(TextField.Input, { onChangeText: function (value) {
                                                    inviteCodeValueRef.current = value.trim();
                                                    if (state.errorField === 'invite-code' &&
                                                        value.trim().length > 0) {
                                                        dispatch({ type: 'clearError' });
                                                    }
                                                }, label: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Required for this provider"], ["Required for this provider"])))), defaultValue: state.inviteCode, autoCapitalize: "none", autoComplete: "email", keyboardType: "email-address", returnKeyType: "next", submitBehavior: native('submit'), onSubmitEditing: native(function () { var _a; return (_a = emailInputRef.current) === null || _a === void 0 ? void 0 : _a.focus(); }) })] })] })), _jsxs(View, { children: [_jsx(TextField.LabelText, { children: _jsx(Trans, { children: "Email" }) }), _jsxs(TextField.Root, { isInvalid: state.errorField === 'email', children: [_jsx(TextField.Icon, { icon: Envelope }), _jsx(TextField.Input, { testID: "emailInput", inputRef: emailInputRef, onChangeText: function (value) {
                                                    emailValueRef.current = value.trim();
                                                    if (hasWarnedEmail) {
                                                        setHasWarnedEmail(false);
                                                    }
                                                    if (state.errorField === 'email' &&
                                                        value.trim().length > 0 &&
                                                        EmailValidator.validate(value.trim())) {
                                                        dispatch({ type: 'clearError' });
                                                    }
                                                }, label: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Enter your email address"], ["Enter your email address"])))), defaultValue: state.email, autoCapitalize: "none", autoComplete: "email", keyboardType: "email-address", returnKeyType: "next", submitBehavior: native('submit'), onSubmitEditing: native(function () { var _a; return (_a = passwordInputRef.current) === null || _a === void 0 ? void 0 : _a.focus(); }) })] })] }), _jsxs(View, { children: [_jsx(TextField.LabelText, { children: _jsx(Trans, { children: "Password" }) }), _jsxs(TextField.Root, { isInvalid: state.errorField === 'password', children: [_jsx(TextField.Icon, { icon: Lock }), _jsx(TextField.Input, { testID: "passwordInput", inputRef: passwordInputRef, onChangeText: function (value) {
                                                    passwordValueRef.current = value;
                                                    if (state.errorField === 'password' && value.length >= 8) {
                                                        dispatch({ type: 'clearError' });
                                                    }
                                                }, label: _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Choose your password"], ["Choose your password"])))), defaultValue: state.password, secureTextEntry: true, autoComplete: "new-password", autoCapitalize: "none", returnKeyType: "next", submitBehavior: native('blurAndSubmit'), onSubmitEditing: native(function () { var _a; return (_a = birthdateInputRef.current) === null || _a === void 0 ? void 0 : _a.focus(); }), passwordRules: "minlength: 8;" })] })] }), _jsxs(View, { children: [_jsx(DateField.LabelText, { children: _jsx(Trans, { children: "Your birth date" }) }), _jsx(DateField.DateField, { testID: "date", inputRef: birthdateInputRef, value: state.dateOfBirth, onChangeDate: function (date) {
                                            dispatch({
                                                type: 'setDateOfBirth',
                                                value: sanitizeDate(new Date(date)),
                                            });
                                        }, label: _(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["Date of birth"], ["Date of birth"])))), accessibilityHint: _(msg(templateObject_11 || (templateObject_11 = __makeTemplateObject(["Select your date of birth"], ["Select your date of birth"])))), maximumDate: new Date() })] }), _jsxs(View, { style: [a.gap_sm], children: [_jsx(Policies, { serviceDescription: state.serviceDescription }), !isOverRegionMinAccessAge || !isOverAppMinAccessAge ? (_jsx(Admonition.Outer, { type: "error", children: _jsxs(Admonition.Row, { children: [_jsx(Admonition.Icon, {}), _jsxs(Admonition.Content, { children: [_jsx(Admonition.Text, { children: !isOverAppMinAccessAge ? (_jsxs(Trans, { children: ["You must be ", MIN_ACCESS_AGE, " years of age or older to create an account."] })) : (_jsxs(Trans, { children: ["You must be ", aaRegionConfig.minAccessAge, " years of age or older to create an account in your region."] })) }), IS_NATIVE &&
                                                            !isDeviceGeolocationGranted &&
                                                            isOverAppMinAccessAge && (_jsx(Admonition.Text, { children: _jsxs(Trans, { children: ["Have we got your location wrong?", ' ', _jsx(SimpleInlineLinkText, __assign({ label: _(msg(templateObject_12 || (templateObject_12 = __makeTemplateObject(["Tap here to confirm your location with GPS."], ["Tap here to confirm your location with GPS."])))) }, createStaticClick(function () {
                                                                        locationControl.open();
                                                                    }), { children: "Tap here to confirm your location with GPS." }))] }) }))] })] }) })) : !isOverMinAdultAge ? (_jsx(Admonition.Admonition, { type: "warning", children: _jsx(Trans, { children: "If you are not yet an adult according to the laws of your country, your parent or legal guardian must read these Terms on your behalf." }) })) : undefined] }), IS_NATIVE && (_jsx(DeviceLocationRequestDialog, { control: locationControl, onLocationAcquired: function (props) {
                                    props.closeDialog(function () {
                                        // set this after close!
                                        setDeviceGeolocation(props.geolocation);
                                        Toast.show(_(msg(templateObject_13 || (templateObject_13 = __makeTemplateObject(["Your location has been updated."], ["Your location has been updated."])))), {
                                            type: 'success',
                                        });
                                    });
                                } }))] })) : undefined] }), _jsx(BackNextButtons, { hideNext: !isOverRegionMinAccessAge, showRetry: isServerError, isLoading: state.isLoading, onBackPress: onPressBack, onNextPress: onNextPress, onRetryPress: refetchServer, overrideNextText: hasWarnedEmail ? _(msg(templateObject_14 || (templateObject_14 = __makeTemplateObject(["It's correct"], ["It's correct"])))) : undefined })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14;
