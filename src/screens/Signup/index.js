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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useReducer, useState } from 'react';
import { AppState, View } from 'react-native';
import ReactNativeDeviceAttest from 'react-native-device-attest';
import Animated, { FadeIn, LayoutAnimationConfig } from 'react-native-reanimated';
import { AppBskyGraphStarterpack } from '@atproto/api';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { FEEDBACK_FORM_URL } from '#/lib/constants';
import { logger } from '#/logger';
import { useServiceQuery } from '#/state/queries/service';
import { useStarterPackQuery } from '#/state/queries/starter-packs';
import { useActiveStarterPack } from '#/state/shell/starter-pack';
import { LoggedOutLayout } from '#/view/com/util/layouts/LoggedOutLayout';
import { initialState, reducer, SignupContext, SignupStep, useSubmitSignup, } from '#/screens/Signup/state';
import { StepCaptcha } from '#/screens/Signup/StepCaptcha';
import { StepHandle } from '#/screens/Signup/StepHandle';
import { StepInfo } from '#/screens/Signup/StepInfo';
import { atoms as a, native, useBreakpoints, useTheme } from '#/alf';
import { AppLanguageDropdown } from '#/components/AppLanguageDropdown';
import { Divider } from '#/components/Divider';
import { LinearGradientBackground } from '#/components/LinearGradientBackground';
import { InlineLinkText } from '#/components/Link';
import { ScreenTransition } from '#/components/ScreenTransition';
import { Text } from '#/components/Typography';
import { useAnalytics } from '#/analytics';
import { GCP_PROJECT_ID, IS_ANDROID } from '#/env';
import * as bsky from '#/types/bsky';
export function Signup(_a) {
    var _b;
    var onPressBack = _a.onPressBack;
    var ax = useAnalytics();
    var _ = useLingui()._;
    var t = useTheme();
    var _c = useReducer(reducer, __assign(__assign({}, initialState), { analytics: ax })), state = _c[0], dispatch = _c[1];
    var gtMobile = useBreakpoints().gtMobile;
    var submit = useSubmitSignup();
    useEffect(function () {
        dispatch({
            type: 'setAnalytics',
            value: ax,
        });
    }, [ax]);
    var activeStarterPack = useActiveStarterPack();
    var _d = useStarterPackQuery({
        uri: activeStarterPack === null || activeStarterPack === void 0 ? void 0 : activeStarterPack.uri,
    }), starterPack = _d.data, isFetchingStarterPack = _d.isFetching, isErrorStarterPack = _d.isError;
    var isFetchedAtMount = useState(starterPack != null)[0];
    var showStarterPackCard = (activeStarterPack === null || activeStarterPack === void 0 ? void 0 : activeStarterPack.uri) && !isFetchingStarterPack && starterPack;
    var _e = useServiceQuery(state.serviceUrl), serviceInfo = _e.data, isFetching = _e.isFetching, isError = _e.isError, refetch = _e.refetch;
    useEffect(function () {
        if (isFetching) {
            dispatch({ type: 'setIsLoading', value: true });
        }
        else if (!isFetching) {
            dispatch({ type: 'setIsLoading', value: false });
        }
    }, [isFetching]);
    useEffect(function () {
        if (isError) {
            dispatch({ type: 'setServiceDescription', value: undefined });
            dispatch({
                type: 'setError',
                value: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Unable to contact your service. Please check your Internet connection."], ["Unable to contact your service. Please check your Internet connection."])))),
            });
        }
        else if (serviceInfo) {
            dispatch({ type: 'setServiceDescription', value: serviceInfo });
            dispatch({ type: 'setError', value: '' });
        }
    }, [_, serviceInfo, isError]);
    useEffect(function () {
        if (state.pendingSubmit) {
            if (!state.pendingSubmit.mutableProcessed) {
                state.pendingSubmit.mutableProcessed = true;
                submit(state, dispatch);
            }
        }
    }, [state, dispatch, submit]);
    // Track app backgrounding during signup
    useEffect(function () {
        var subscription = AppState.addEventListener('change', function (nextAppState) {
            if (nextAppState === 'background') {
                dispatch({ type: 'incrementBackgroundCount' });
            }
        });
        return function () { return subscription.remove(); };
    }, []);
    // On Android, warmup the Play Integrity API on the signup screen so it is ready by the time we get to the gate screen.
    useEffect(function () {
        if (!IS_ANDROID) {
            return;
        }
        ReactNativeDeviceAttest.warmupIntegrity(GCP_PROJECT_ID).catch(function (err) {
            return logger.error(err);
        });
    }, []);
    return (_jsx(Animated.View, { exiting: native(FadeIn.duration(90)), style: a.flex_1, children: _jsx(SignupContext.Provider, { value: { state: state, dispatch: dispatch }, children: _jsx(LoggedOutLayout, { leadin: "", title: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Create Account"], ["Create Account"])))), description: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["We're so excited to have you join us!"], ["We're so excited to have you join us!"])))), scrollable: true, children: _jsxs(View, { testID: "createAccount", style: a.flex_1, children: [showStarterPackCard &&
                            bsky.dangerousIsType(starterPack.record, AppBskyGraphStarterpack.isRecord) ? (_jsx(Animated.View, { entering: !isFetchedAtMount ? FadeIn : undefined, children: _jsxs(LinearGradientBackground, { style: [a.mx_lg, a.p_lg, a.gap_sm, a.rounded_sm], children: [_jsx(Text, { style: [a.font_semi_bold, a.text_xl, { color: 'white' }], children: starterPack.record.name }), _jsx(Text, { style: [{ color: 'white' }], children: ((_b = starterPack.feeds) === null || _b === void 0 ? void 0 : _b.length) ? (_jsx(Trans, { children: "You'll follow the suggested users and feeds once you finish creating your account!" })) : (_jsx(Trans, { children: "You'll follow the suggested users once you finish creating your account!" })) })] }) })) : null, _jsx(LayoutAnimationConfig, { skipEntering: true, children: _jsx(ScreenTransition, { direction: state.screenTransitionDirection, children: _jsxs(View, { style: [
                                        a.flex_1,
                                        a.px_xl,
                                        a.pt_2xl,
                                        !gtMobile && { paddingBottom: 100 },
                                    ], children: [_jsxs(View, { style: [a.gap_sm, a.pb_3xl], children: [_jsx(Text, { style: [a.font_semi_bold, t.atoms.text_contrast_medium], children: _jsxs(Trans, { children: ["Step ", state.activeStep + 1, " of", ' ', state.serviceDescription &&
                                                                !state.serviceDescription.phoneVerificationRequired
                                                                ? '2'
                                                                : '3'] }) }), _jsx(Text, { style: [a.text_3xl, a.font_semi_bold], children: state.activeStep === SignupStep.INFO ? (_jsx(Trans, { children: "Your account" })) : state.activeStep === SignupStep.HANDLE ? (_jsx(Trans, { children: "Choose your username" })) : (_jsx(Trans, { children: "Complete the challenge" })) })] }), state.activeStep === SignupStep.INFO ? (_jsx(StepInfo, { onPressBack: onPressBack, isLoadingStarterPack: isFetchingStarterPack && !isErrorStarterPack, isServerError: isError, refetchServer: refetch })) : state.activeStep === SignupStep.HANDLE ? (_jsx(StepHandle, {})) : (_jsx(StepCaptcha, {})), _jsx(Divider, {}), _jsxs(View, { style: [
                                                a.w_full,
                                                a.py_lg,
                                                a.flex_row,
                                                a.gap_md,
                                                a.align_center,
                                            ], children: [_jsx(AppLanguageDropdown, {}), _jsxs(Text, { style: [
                                                        a.flex_1,
                                                        t.atoms.text_contrast_medium,
                                                        !gtMobile && a.text_md,
                                                    ], children: [_jsx(Trans, { children: "Having trouble?" }), ' ', _jsx(InlineLinkText, { label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Contact support"], ["Contact support"])))), to: FEEDBACK_FORM_URL({ email: state.email }), style: [!gtMobile && a.text_md], children: _jsx(Trans, { children: "Contact support" }) })] })] })] }) }, state.activeStep) })] }) }) }) }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4;
