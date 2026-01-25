var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View } from 'react-native';
import { Image } from 'expo-image';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { atoms as a, useTheme } from '#/alf';
import { Text } from '#/components/Typography';
import { PROP_1, PROP_2, PROP_3 } from './images';
import { Dot, useValuePropText } from './ValuePropositionPager.shared';
export function ValuePropositionPager(_a) {
    var step = _a.step, avatarUri = _a.avatarUri;
    var t = useTheme();
    var _ = useLingui()._;
    var image = [PROP_1[t.name], PROP_2[t.name], PROP_3[t.name]][step];
    var _b = useValuePropText(step), title = _b.title, description = _b.description, alt = _b.alt;
    return (_jsxs(View, { children: [_jsxs(View, { style: [
                    a.relative,
                    a.align_center,
                    a.justify_center,
                    a.pointer_events_none,
                ], children: [_jsx(Image, { source: image, style: [a.w_full, { aspectRatio: 1 }], alt: alt, accessibilityIgnoresInvertColors: false }), step === 1 && (_jsx(Image, { source: avatarUri, style: [
                            a.z_10,
                            a.absolute,
                            a.rounded_full,
                            {
                                width: "".concat((80 / 393) * 100, "%"),
                                height: "".concat((80 / 393) * 100, "%"),
                            },
                        ], accessibilityIgnoresInvertColors: true, alt: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Your profile picture"], ["Your profile picture"])))) }))] }), _jsxs(View, { style: [a.mt_4xl, a.gap_2xl, a.align_center], children: [_jsxs(View, { style: [a.flex_row, a.gap_sm], children: [_jsx(Dot, { active: step === 0 }), _jsx(Dot, { active: step === 1 }), _jsx(Dot, { active: step === 2 })] }), _jsxs(View, { style: [a.gap_sm], children: [_jsx(Text, { style: [a.font_bold, a.text_3xl, a.text_center], children: title }), _jsx(Text, { style: [
                                    t.atoms.text_contrast_medium,
                                    a.text_md,
                                    a.leading_snug,
                                    a.text_center,
                                ], children: description })] })] })] }));
}
var templateObject_1;
