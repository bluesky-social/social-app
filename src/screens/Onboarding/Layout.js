var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useOnboardingDispatch } from '#/state/shell';
import { useOnboardingInternalState } from '#/screens/Onboarding/state';
import { atoms as a, native, tokens, useBreakpoints, useTheme, web, } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { ArrowLeft_Stroke2_Corner0_Rounded as ArrowLeft } from '#/components/icons/Arrow';
import { HEADER_SLOT_SIZE } from '#/components/Layout';
import { createPortalGroup } from '#/components/Portal';
import { P, Text } from '#/components/Typography';
import { IS_ANDROID, IS_INTERNAL, IS_WEB } from '#/env';
var ONBOARDING_COL_WIDTH = 420;
export var OnboardingControls = createPortalGroup();
export var OnboardingHeaderSlot = createPortalGroup();
export function Layout(_a) {
    var _b;
    var children = _a.children;
    var _ = useLingui()._;
    var t = useTheme();
    var insets = useSafeAreaInsets();
    var gtMobile = useBreakpoints().gtMobile;
    var onboardDispatch = useOnboardingDispatch();
    var _c = useOnboardingInternalState(), state = _c.state, dispatch = _c.dispatch;
    var scrollview = useRef(null);
    var prevActiveStep = useRef(state.activeStep);
    useEffect(function () {
        var _a;
        if (state.activeStep !== prevActiveStep.current) {
            prevActiveStep.current = state.activeStep;
            (_a = scrollview.current) === null || _a === void 0 ? void 0 : _a.scrollTo({ y: 0, animated: false });
        }
    }, [state]);
    var dialogLabel = _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Set up your account"], ["Set up your account"]))));
    var _d = useState(0), headerHeight = _d[0], setHeaderHeight = _d[1];
    var _e = useState(0), footerHeight = _e[0], setFooterHeight = _e[1];
    return (_jsxs(View, { "aria-modal": true, role: "dialog", "aria-role": "dialog", "aria-label": dialogLabel, accessibilityLabel: dialogLabel, accessibilityHint: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Customizes your Bluesky experience"], ["Customizes your Bluesky experience"])))), style: [IS_WEB ? a.fixed : a.absolute, a.inset_0, a.flex_1, t.atoms.bg], children: [!gtMobile ? (_jsx(View, { style: [
                    web(a.fixed),
                    native(a.absolute),
                    a.top_0,
                    a.left_0,
                    a.right_0,
                    a.flex_row,
                    a.w_full,
                    a.justify_center,
                    a.z_20,
                    a.px_xl,
                    { paddingTop: ((_b = web(tokens.space.lg)) !== null && _b !== void 0 ? _b : 0) + insets.top },
                    native([t.atoms.bg, a.pb_xs, { minHeight: 48 }]),
                    web(a.pointer_events_box_none),
                ], onLayout: function (evt) { return setHeaderHeight(evt.nativeEvent.layout.height); }, children: _jsxs(View, { style: [
                        a.w_full,
                        a.align_center,
                        a.flex_row,
                        a.justify_between,
                        web({ maxWidth: ONBOARDING_COL_WIDTH }),
                        web(a.pointer_events_box_none),
                    ], children: [_jsx(HeaderSlot, { children: state.canGoBack && (_jsx(Button, { color: "secondary", variant: "ghost", shape: "round", size: "small", label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Go back to previous step"], ["Go back to previous step"])))), onPress: function () { return dispatch({ type: 'prev' }); }, children: _jsx(ButtonIcon, { icon: ArrowLeft, size: "lg" }) }, state.activeStep)) }), IS_INTERNAL && (_jsx(Button, { variant: "ghost", color: "negative", size: "tiny", onPress: function () { return onboardDispatch({ type: 'skip' }); }, 
                            // DEV ONLY
                            label: "Clear onboarding state", children: _jsx(ButtonText, { children: "[DEV] Clear" }) })), _jsx(HeaderSlot, { children: _jsx(OnboardingHeaderSlot.Outlet, {}) })] }) })) : (_jsx(_Fragment, { children: IS_INTERNAL && (_jsx(View, { style: [
                        a.absolute,
                        a.align_center,
                        a.z_10,
                        { top: 0, left: 0, right: 0 },
                    ], children: _jsx(Button, { variant: "ghost", color: "negative", size: "tiny", onPress: function () { return onboardDispatch({ type: 'skip' }); }, 
                        // DEV ONLY
                        label: "Clear onboarding state", children: _jsx(ButtonText, { children: "[DEV] Clear" }) }) })) })), _jsx(ScrollView, { ref: scrollview, style: [a.h_full, a.w_full], contentContainerStyle: {
                    borderWidth: 0,
                    minHeight: '100%',
                    paddingTop: gtMobile ? 40 : headerHeight,
                    paddingBottom: footerHeight,
                }, showsVerticalScrollIndicator: !IS_ANDROID, scrollIndicatorInsets: { bottom: footerHeight - insets.bottom }, 
                // @ts-expect-error web only --prf
                dataSet: { 'stable-gutters': 1 }, centerContent: gtMobile, children: _jsx(View, { style: [a.flex_row, a.justify_center, gtMobile ? a.px_5xl : a.px_xl], children: _jsx(View, { style: [a.flex_1, web({ maxWidth: ONBOARDING_COL_WIDTH })], children: _jsx(View, { style: [a.w_full, a.py_md], children: children }) }) }) }), _jsx(View, { onLayout: function (evt) { return setFooterHeight(evt.nativeEvent.layout.height); }, style: [
                    IS_WEB ? a.fixed : a.absolute,
                    { bottom: 0, left: 0, right: 0 },
                    t.atoms.bg,
                    t.atoms.border_contrast_low,
                    a.border_t,
                    a.align_center,
                    gtMobile ? a.px_5xl : a.px_xl,
                    IS_WEB
                        ? a.py_2xl
                        : {
                            paddingTop: tokens.space.md,
                            paddingBottom: insets.bottom + tokens.space.md,
                        },
                ], children: _jsxs(View, { style: [
                        a.w_full,
                        { maxWidth: ONBOARDING_COL_WIDTH },
                        gtMobile && [a.flex_row, a.justify_between, a.align_center],
                    ], children: [gtMobile &&
                            (state.canGoBack ? (_jsx(Button, { color: "secondary", variant: "ghost", shape: "square", size: "small", label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Go back to previous step"], ["Go back to previous step"])))), onPress: function () { return dispatch({ type: 'prev' }); }, children: _jsx(ButtonIcon, { icon: ArrowLeft, size: "lg" }) }, state.activeStep)) : (_jsx(View, { style: { height: 33 } }))), _jsx(OnboardingControls.Outlet, {})] }) })] }));
}
function HeaderSlot(_a) {
    var children = _a.children;
    return (_jsx(View, { style: [{ minHeight: HEADER_SLOT_SIZE, minWidth: HEADER_SLOT_SIZE }], children: children }));
}
export function OnboardingPosition() {
    var state = useOnboardingInternalState().state;
    var t = useTheme();
    return (_jsx(Text, { style: [a.text_sm, a.font_medium, t.atoms.text_contrast_medium], children: _jsxs(Trans, { children: ["Step ", state.activeStepIndex + 1, " of ", state.totalSteps] }) }));
}
export function OnboardingTitleText(_a) {
    var children = _a.children, style = _a.style;
    return (_jsx(Text, { style: [a.text_3xl, a.font_bold, a.leading_snug, style], children: children }));
}
export function OnboardingDescriptionText(_a) {
    var children = _a.children, style = _a.style;
    var t = useTheme();
    return (_jsx(P, { style: [a.text_md, a.leading_snug, t.atoms.text_contrast_medium, style], children: children }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4;
