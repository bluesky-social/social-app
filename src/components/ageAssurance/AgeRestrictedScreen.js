var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View } from 'react-native';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { atoms as a } from '#/alf';
import { Admonition } from '#/components/Admonition';
import { AgeAssuranceBadge } from '#/components/ageAssurance/AgeAssuranceBadge';
import { AgeAssuranceConfigUnavailableError } from '#/components/ageAssurance/AgeAssuranceErrors';
import { useAgeAssuranceCopy } from '#/components/ageAssurance/useAgeAssuranceCopy';
import { ButtonIcon, ButtonText } from '#/components/Button';
import { ChevronRight_Stroke2_Corner0_Rounded as ChevronRight } from '#/components/icons/Chevron';
import * as Layout from '#/components/Layout';
import { Link } from '#/components/Link';
import { Text } from '#/components/Typography';
import { useAgeAssurance } from '#/ageAssurance';
import { useAnalytics } from '#/analytics';
export function AgeRestrictedScreen(_a) {
    var children = _a.children, screenTitle = _a.screenTitle, infoText = _a.infoText, rightHeaderSlot = _a.rightHeaderSlot;
    var _ = useLingui()._;
    var ax = useAnalytics();
    var copy = useAgeAssuranceCopy();
    var aa = useAgeAssurance();
    if (aa.state.access === aa.Access.Full)
        return children;
    return (_jsxs(Layout.Screen, { children: [_jsxs(Layout.Header.Outer, { children: [_jsx(Layout.Header.BackButton, {}), _jsx(Layout.Header.Content, { align: "left", children: _jsx(Layout.Header.TitleText, { children: screenTitle !== null && screenTitle !== void 0 ? screenTitle : _jsx(Trans, { children: "Unavailable" }) }) }), rightHeaderSlot !== null && rightHeaderSlot !== void 0 ? rightHeaderSlot : _jsx(Layout.Header.Slot, {})] }), _jsx(Layout.Content, { children: _jsxs(View, { style: [a.p_lg], children: [aa.state.error === 'config' && (_jsx(View, { style: [a.pb_lg], children: _jsx(AgeAssuranceConfigUnavailableError, {}) })), _jsx(View, { style: [a.align_start, a.pb_lg], children: _jsx(AgeAssuranceBadge, {}) }), _jsxs(View, { style: [a.gap_sm, a.pb_lg], children: [_jsx(Text, { style: [a.text_xl, a.leading_snug, a.font_bold], children: _jsx(Trans, { children: "You must complete age assurance in order to access this screen." }) }), _jsx(Text, { style: [a.text_md, a.leading_snug], children: copy.notice })] }), _jsx(View, { style: [a.flex_row, a.justify_between, a.align_center, a.pb_xl], children: _jsxs(Link, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Go to account settings"], ["Go to account settings"])))), to: "/settings/account", size: "small", variant: "solid", color: "primary", onPress: function () {
                                    ax.metric('ageAssurance:navigateToSettings', {});
                                }, children: [_jsx(ButtonText, { children: _jsx(Trans, { children: "Go to account settings" }) }), _jsx(ButtonIcon, { icon: ChevronRight, position: "right" })] }) }), infoText && _jsx(Admonition, { type: "tip", children: infoText })] }) })] }));
}
var templateObject_1;
