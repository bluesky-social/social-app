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
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { dateDiff, useGetTimeAgo } from '#/lib/hooks/useTimeAgo';
import { atoms as a, useBreakpoints, useTheme } from '#/alf';
import { Admonition } from '#/components/Admonition';
import { AgeAssuranceAppealDialog } from '#/components/ageAssurance/AgeAssuranceAppealDialog';
import { AgeAssuranceBadge } from '#/components/ageAssurance/AgeAssuranceBadge';
import { AgeAssuranceConfigUnavailableError } from '#/components/ageAssurance/AgeAssuranceErrors';
import { AgeAssuranceInitDialog, useDialogControl, } from '#/components/ageAssurance/AgeAssuranceInitDialog';
import { useAgeAssuranceCopy } from '#/components/ageAssurance/useAgeAssuranceCopy';
import { Button, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { DeviceLocationRequestDialog } from '#/components/dialogs/DeviceLocationRequestDialog';
import { Divider } from '#/components/Divider';
import { createStaticClick, InlineLinkText } from '#/components/Link';
import * as Toast from '#/components/Toast';
import { Text } from '#/components/Typography';
import { useAgeAssurance } from '#/ageAssurance';
import { useComputeAgeAssuranceRegionAccess } from '#/ageAssurance/useComputeAgeAssuranceRegionAccess';
import { useAnalytics } from '#/analytics';
import { IS_NATIVE } from '#/env';
import { useDeviceGeolocationApi } from '#/geolocation';
export function AgeAssuranceAccountCard(_a) {
    var style = _a.style;
    var aa = useAgeAssurance();
    if (aa.state.access === aa.Access.Full)
        return null;
    if (aa.state.error === 'config') {
        return (_jsx(View, { style: style, children: _jsx(AgeAssuranceConfigUnavailableError, {}) }));
    }
    return _jsx(Inner, { style: style });
}
function Inner(_a) {
    var style = _a.style;
    var t = useTheme();
    var _b = useLingui(), _ = _b._, i18n = _b.i18n;
    var ax = useAnalytics();
    var control = useDialogControl();
    var appealControl = Dialog.useDialogControl();
    var locationControl = Dialog.useDialogControl();
    var getTimeAgo = useGetTimeAgo();
    var gtPhone = useBreakpoints().gtPhone;
    var setDeviceGeolocation = useDeviceGeolocationApi().setDeviceGeolocation;
    var computeAgeAssuranceRegionAccess = useComputeAgeAssuranceRegionAccess();
    var copy = useAgeAssuranceCopy();
    var aa = useAgeAssurance();
    var _c = aa.state, status = _c.status, lastInitiatedAt = _c.lastInitiatedAt;
    var isBlocked = status === aa.Status.Blocked;
    var hasInitiated = !!lastInitiatedAt;
    var hasCompletedFlow = status === aa.Status.Assured;
    var timeAgo = lastInitiatedAt
        ? getTimeAgo(lastInitiatedAt, new Date())
        : null;
    var diff = lastInitiatedAt
        ? dateDiff(lastInitiatedAt, new Date(), 'down')
        : null;
    return (_jsxs(_Fragment, { children: [_jsx(AgeAssuranceInitDialog, { control: control }), _jsx(AgeAssuranceAppealDialog, { control: appealControl }), _jsx(View, { style: style, children: _jsxs(View, { style: [a.p_lg, a.rounded_md, a.border, t.atoms.border_contrast_low], children: [_jsx(View, { style: [
                                a.flex_row,
                                a.justify_between,
                                a.align_center,
                                a.gap_lg,
                                a.pb_md,
                                a.z_10,
                            ], children: _jsx(View, { style: [a.align_start], children: _jsx(AgeAssuranceBadge, {}) }) }), _jsxs(View, { style: [a.pb_md, a.gap_sm], children: [_jsx(Text, { style: [a.text_sm, a.leading_snug], children: copy.notice }), hasCompletedFlow && (_jsx(Text, { style: [a.text_sm, a.leading_snug], children: _jsxs(Trans, { children: ["If you are 18 years of age or older and want to try again, click the button below and use a different verification method if one is available in your region. If you have questions or concerns,", ' ', _jsx(InlineLinkText, __assign({ label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Contact our support team"], ["Contact our support team"])))) }, createStaticClick(function () {
                                                appealControl.open();
                                            }), { children: "our support team can help." }))] }) })), IS_NATIVE && (_jsxs(_Fragment, { children: [_jsx(Text, { style: [a.text_sm, a.leading_snug], children: _jsxs(Trans, { children: ["Is your location not accurate?", ' ', _jsx(InlineLinkText, __assign({ label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Confirm your location"], ["Confirm your location"])))) }, createStaticClick(function () {
                                                        locationControl.open();
                                                    }), { children: "Tap here to confirm your location." })), ' '] }) }), _jsx(DeviceLocationRequestDialog, { control: locationControl, onLocationAcquired: function (props) {
                                                var access = computeAgeAssuranceRegionAccess(props.geolocation);
                                                if (access !== aa.Access.Full) {
                                                    props.disableDialogAction();
                                                    props.setDialogError(_(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["We're sorry, but based on your device's location, you are currently located in a region that requires age assurance."], ["We're sorry, but based on your device's location, you are currently located in a region that requires age assurance."])))));
                                                }
                                                else {
                                                    props.closeDialog(function () {
                                                        // set this after close!
                                                        setDeviceGeolocation(props.geolocation);
                                                        Toast.show(_(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Thanks! You're all set."], ["Thanks! You're all set."])))), {
                                                            type: 'success',
                                                        });
                                                    });
                                                }
                                            } })] }))] }), isBlocked ? (_jsx(Admonition, { type: "warning", children: _jsxs(Trans, { children: ["You are currently unable to access Bluesky's Age Assurance flow. Please", ' ', _jsx(InlineLinkText, __assign({ label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Contact our moderation team"], ["Contact our moderation team"])))) }, createStaticClick(function () {
                                        appealControl.open();
                                        ax.metric('ageAssurance:appealDialogOpen', {});
                                    }), { children: "contact our moderation team" })), ' ', "if you believe this is an error."] }) })) : (_jsxs(_Fragment, { children: [_jsx(Divider, {}), _jsxs(View, { style: [
                                        a.pt_md,
                                        gtPhone
                                            ? [
                                                a.flex_row_reverse,
                                                a.gap_xl,
                                                a.justify_between,
                                                a.align_center,
                                            ]
                                            : [a.gap_md],
                                    ], children: [_jsx(Button, { label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Verify now"], ["Verify now"])))), size: "small", variant: "solid", color: hasInitiated ? 'secondary' : 'primary', onPress: function () {
                                                control.open();
                                                ax.metric('ageAssurance:initDialogOpen', {
                                                    hasInitiatedPreviously: hasInitiated,
                                                });
                                            }, children: _jsx(ButtonText, { children: hasInitiated ? (_jsx(Trans, { children: "Verify again" })) : (_jsx(Trans, { children: "Verify now" })) }) }), lastInitiatedAt && timeAgo && diff ? (_jsx(Text, { style: [a.text_sm, a.italic, t.atoms.text_contrast_medium], title: i18n.date(lastInitiatedAt, {
                                                dateStyle: 'medium',
                                                timeStyle: 'medium',
                                            }), children: diff.value === 0 ? (_jsx(Trans, { children: "Last initiated just now" })) : (_jsxs(Trans, { children: ["Last initiated ", timeAgo, " ago"] })) })) : (_jsx(Text, { style: [a.text_sm, a.italic, t.atoms.text_contrast_medium], children: _jsx(Trans, { children: "Age assurance only takes a few minutes" }) }))] })] }))] }) })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6;
