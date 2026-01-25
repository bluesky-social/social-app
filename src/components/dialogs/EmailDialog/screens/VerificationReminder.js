var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View } from 'react-native';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { atoms as a, platform, tokens, useBreakpoints, useTheme } from '#/alf';
import { Button, ButtonText } from '#/components/Button';
import { useDialogContext } from '#/components/Dialog';
import { ScreenID, } from '#/components/dialogs/EmailDialog/types';
import { Divider } from '#/components/Divider';
import { GradientFill } from '#/components/GradientFill';
import { ShieldCheck_Stroke2_Corner0_Rounded as ShieldIcon } from '#/components/icons/Shield';
import { Text } from '#/components/Typography';
export function VerificationReminder(_a) {
    var showScreen = _a.showScreen;
    var t = useTheme();
    var _ = useLingui()._;
    var _b = useBreakpoints(), gtPhone = _b.gtPhone, gtMobile = _b.gtMobile;
    var control = useDialogContext();
    var dialogPadding = gtMobile ? a.p_2xl.padding : a.p_xl.padding;
    return (_jsxs(View, { style: [a.gap_lg], children: [_jsx(View, { style: [
                    a.absolute,
                    {
                        top: platform({ web: dialogPadding, default: a.p_2xl.padding }) * -1,
                        left: dialogPadding * -1,
                        right: dialogPadding * -1,
                        height: 150,
                    },
                ], children: _jsxs(View, { style: [
                        a.absolute,
                        a.inset_0,
                        a.align_center,
                        a.justify_center,
                        a.overflow_hidden,
                        a.pt_md,
                        t.atoms.bg_contrast_100,
                        {
                            borderTopLeftRadius: a.rounded_md.borderRadius,
                            borderTopRightRadius: a.rounded_md.borderRadius,
                        },
                    ], children: [_jsx(GradientFill, { gradient: tokens.gradients.primary }), _jsx(ShieldIcon, { width: 64, fill: "white", style: [a.z_10] })] }) }), _jsx(View, { style: [a.mb_xs, { height: 150 - dialogPadding }] }), _jsxs(View, { style: [a.gap_sm], children: [_jsx(Text, { style: [a.text_xl, a.font_bold], children: _jsx(Trans, { children: "Please verify your email" }) }), _jsx(Text, { style: [a.text_sm, a.leading_snug, t.atoms.text_contrast_medium], children: _jsx(Trans, { children: "Your email has not yet been verified. Please verify your email in order to enjoy all the features of Bluesky." }) })] }), _jsx(Divider, {}), _jsxs(View, { style: [a.gap_sm, gtPhone && [a.flex_row_reverse]], children: [_jsx(Button, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Get started"], ["Get started"])))), variant: "solid", color: "primary", size: "large", onPress: function () {
                            return showScreen({
                                id: ScreenID.Verify,
                            });
                        }, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Get started" }) }) }), _jsx(Button, { label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Maybe later"], ["Maybe later"])))), accessibilityHint: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Snoozes the reminder"], ["Snoozes the reminder"])))), variant: "ghost", color: "secondary", size: "large", onPress: function () { return control.close(); }, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Maybe later" }) }) })] })] }));
}
var templateObject_1, templateObject_2, templateObject_3;
