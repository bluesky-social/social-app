var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { atoms as a, select, useTheme } from '#/alf';
import { AgeAssuranceConfigUnavailableError } from '#/components/ageAssurance/AgeAssuranceErrors';
import { useDialogControl } from '#/components/ageAssurance/AgeAssuranceInitDialog';
import { ShieldCheck_Stroke2_Corner0_Rounded as Shield } from '#/components/icons/Shield';
import { InlineLinkText } from '#/components/Link';
import { Text } from '#/components/Typography';
import { useAgeAssurance } from '#/ageAssurance';
import { useAnalytics } from '#/analytics';
export function AgeAssuranceAdmonition(_a) {
    var children = _a.children, style = _a.style;
    var control = useDialogControl();
    var aa = useAgeAssurance();
    if (aa.state.access === aa.Access.Full)
        return null;
    if (aa.state.error === 'config') {
        return _jsx(AgeAssuranceConfigUnavailableError, { style: style });
    }
    return (_jsx(Inner, { style: style, control: control, children: children }));
}
function Inner(_a) {
    var children = _a.children, style = _a.style;
    var t = useTheme();
    var _ = useLingui()._;
    var ax = useAnalytics();
    return (_jsx(_Fragment, { children: _jsx(View, { style: style, children: _jsxs(View, { style: [
                    a.p_md,
                    a.rounded_md,
                    a.border,
                    a.flex_row,
                    a.align_start,
                    a.gap_sm,
                    {
                        backgroundColor: select(t.name, {
                            light: t.palette.primary_25,
                            dark: t.palette.primary_25,
                            dim: t.palette.primary_25,
                        }),
                        borderColor: select(t.name, {
                            light: t.palette.primary_100,
                            dark: t.palette.primary_100,
                            dim: t.palette.primary_100,
                        }),
                    },
                ], children: [_jsx(View, { style: [
                            a.align_center,
                            a.justify_center,
                            a.rounded_full,
                            {
                                width: 32,
                                height: 32,
                                backgroundColor: select(t.name, {
                                    light: t.palette.primary_100,
                                    dark: t.palette.primary_100,
                                    dim: t.palette.primary_100,
                                }),
                            },
                        ], children: _jsx(Shield, { size: "md" }) }), _jsxs(View, { style: [a.flex_1, a.gap_xs, a.pr_4xl], children: [_jsx(Text, { style: [a.text_sm, a.leading_snug], children: children }), _jsx(Text, { style: [a.text_sm, a.leading_snug, a.font_semi_bold], children: _jsxs(Trans, { children: ["Learn more in your", ' ', _jsx(InlineLinkText, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Go to account settings"], ["Go to account settings"])))), to: '/settings/account', style: [a.text_sm, a.leading_snug, a.font_semi_bold], onPress: function () {
                                                ax.metric('ageAssurance:navigateToSettings', {});
                                            }, children: "account settings." })] }) })] })] }) }) }));
}
var templateObject_1;
