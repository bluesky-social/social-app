var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Text as RNText, View } from 'react-native';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { atoms as a, useTheme } from '#/alf';
import { Admonition, Button as AdmonitionButton, Content as AdmonitionContent, Icon as AdmonitionIcon, Outer as AdmonitionOuter, Row as AdmonitionRow, Text as AdmonitionText, } from '#/components/Admonition';
import { ButtonIcon, ButtonText } from '#/components/Button';
import { ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as Retry } from '#/components/icons/ArrowRotate';
import { BellRinging_Filled_Corner0_Rounded as BellRingingFilledIcon } from '#/components/icons/BellRinging';
import { InlineLinkText } from '#/components/Link';
import { H1 } from '#/components/Typography';
export function Admonitions() {
    var _ = useLingui()._;
    var t = useTheme();
    return (_jsxs(View, { style: [a.gap_md], children: [_jsx(H1, { children: "Admonitions" }), _jsx(Admonition, { children: "The quick brown fox jumps over the lazy dog." }), _jsxs(Admonition, { type: "info", children: ["How happy the blameless vestal's lot, the world forgetting by the world forgot.", ' ', _jsx(InlineLinkText, { label: "test", to: "https://letterboxd.com/film/eternal-sunshine-of-the-spotless-mind/", children: "Eternal sunshine of the spotless mind" }), "! Each pray'r accepted, and each wish resign'd."] }), _jsx(Admonition, { type: "tip", children: "The quick brown fox jumps over the lazy dog." }), _jsx(Admonition, { type: "warning", children: "The quick brown fox jumps over the lazy dog." }), _jsx(Admonition, { type: "error", children: "The quick brown fox jumps over the lazy dog." }), _jsx(AdmonitionOuter, { type: "error", children: _jsxs(AdmonitionRow, { children: [_jsx(AdmonitionIcon, {}), _jsx(AdmonitionContent, { children: _jsx(AdmonitionText, { children: _jsx(Trans, { children: "Something went wrong, please try again" }) }) }), _jsxs(AdmonitionButton, { color: "negative_subtle", label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Retry loading report options"], ["Retry loading report options"])))), onPress: function () { }, children: [_jsx(ButtonText, { children: _jsx(Trans, { children: "Retry" }) }), _jsx(ButtonIcon, { icon: Retry })] })] }) }), _jsx(AdmonitionOuter, { type: "tip", children: _jsxs(AdmonitionRow, { children: [_jsx(AdmonitionIcon, {}), _jsxs(AdmonitionContent, { children: [_jsx(AdmonitionText, { children: _jsxs(Trans, { children: ["Enable notifications for an account by visiting their profile and pressing the", ' ', _jsx(RNText, { style: [a.font_bold, t.atoms.text_contrast_high], children: "bell icon" }), ' ', _jsx(BellRingingFilledIcon, { size: "xs", style: t.atoms.text_contrast_high }), "."] }) }), _jsx(AdmonitionText, { children: _jsxs(Trans, { children: ["If you want to restrict who can receive notifications for your account's activity, you can change this in", ' ', _jsx(InlineLinkText, { label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Privacy and Security settings"], ["Privacy and Security settings"])))), to: { screen: 'ActivityPrivacySettings' }, style: [a.font_bold], children: "Settings \u2192 Privacy and Security" }), "."] }) })] })] }) })] }));
}
var templateObject_1, templateObject_2;
