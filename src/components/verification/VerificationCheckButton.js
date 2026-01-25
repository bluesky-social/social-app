var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { View } from 'react-native';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { atoms as a, useBreakpoints, useTheme } from '#/alf';
import { Button } from '#/components/Button';
import { useDialogControl } from '#/components/Dialog';
import { useFullVerificationState } from '#/components/verification';
import { VerificationCheck } from '#/components/verification/VerificationCheck';
import { VerificationsDialog } from '#/components/verification/VerificationsDialog';
import { VerifierDialog } from '#/components/verification/VerifierDialog';
import { useAnalytics } from '#/analytics';
export function shouldShowVerificationCheckButton(state) {
    var ok = false;
    if (state.profile.role === 'default') {
        if (state.profile.isVerified) {
            ok = true;
        }
        else if (state.profile.isViewer && state.profile.wasVerified) {
            ok = true;
        }
        else if (state.viewer.role === 'verifier' &&
            state.viewer.hasIssuedVerification) {
            ok = true;
        }
    }
    else if (state.profile.role === 'verifier') {
        if (state.profile.isViewer) {
            ok = true;
        }
        else if (state.profile.isVerified) {
            ok = true;
        }
    }
    if (!state.profile.showBadge &&
        !state.profile.isViewer &&
        !(state.viewer.role === 'verifier' && state.viewer.hasIssuedVerification)) {
        ok = false;
    }
    return ok;
}
export function VerificationCheckButton(_a) {
    var profile = _a.profile, size = _a.size;
    var state = useFullVerificationState({
        profile: profile,
    });
    if (shouldShowVerificationCheckButton(state)) {
        return _jsx(Badge, { profile: profile, verificationState: state, size: size });
    }
    return null;
}
export function Badge(_a) {
    var profile = _a.profile, state = _a.verificationState, size = _a.size;
    var t = useTheme();
    var ax = useAnalytics();
    var _ = useLingui()._;
    var verificationsDialogControl = useDialogControl();
    var verifierDialogControl = useDialogControl();
    var gtPhone = useBreakpoints().gtPhone;
    var dimensions = 12;
    if (size === 'lg') {
        dimensions = gtPhone ? 20 : 18;
    }
    else if (size === 'md') {
        dimensions = 14;
    }
    var verifiedByHidden = !state.profile.showBadge && state.profile.isViewer;
    return (_jsxs(_Fragment, { children: [_jsx(Button, { label: state.profile.isViewer
                    ? _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["View your verifications"], ["View your verifications"]))))
                    : _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["View this user's verifications"], ["View this user's verifications"])))), hitSlop: 20, onPress: function (evt) {
                    evt.preventDefault();
                    ax.metric('verification:badge:click', {});
                    if (state.profile.role === 'verifier') {
                        verifierDialogControl.open();
                    }
                    else {
                        verificationsDialogControl.open();
                    }
                }, children: function (_a) {
                    var hovered = _a.hovered;
                    return (_jsx(View, { style: [
                            a.justify_end,
                            a.align_end,
                            a.transition_transform,
                            {
                                width: dimensions,
                                height: dimensions,
                                transform: [
                                    {
                                        scale: hovered ? 1.1 : 1,
                                    },
                                ],
                            },
                        ], children: _jsx(VerificationCheck, { width: dimensions, fill: verifiedByHidden
                                ? t.atoms.bg_contrast_100.backgroundColor
                                : state.profile.isVerified
                                    ? t.palette.primary_500
                                    : t.atoms.bg_contrast_100.backgroundColor, verifier: state.profile.role === 'verifier' }) }));
                } }), _jsx(VerificationsDialog, { control: verificationsDialogControl, profile: profile, verificationState: state }), _jsx(VerifierDialog, { control: verifierDialogControl, profile: profile, verificationState: state })] }));
}
var templateObject_1, templateObject_2;
