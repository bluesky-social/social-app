var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState } from 'react';
import { View } from 'react-native';
import PagerView from 'react-native-pager-view';
import { Image } from 'expo-image';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { atoms as a, tokens, useTheme } from '#/alf';
import { Text } from '#/components/Typography';
import { PROP_1, PROP_2, PROP_3 } from './images';
import { Dot, useValuePropText } from './ValuePropositionPager.shared';
export function ValuePropositionPager(_a) {
    var _b;
    var step = _a.step, setStep = _a.setStep, avatarUri = _a.avatarUri;
    var t = useTheme();
    var _c = useState(step), activePage = _c[0], setActivePage = _c[1];
    var ref = useRef(null);
    if (step !== activePage) {
        setActivePage(step);
        (_b = ref.current) === null || _b === void 0 ? void 0 : _b.setPage(step);
    }
    var images = [PROP_1[t.name], PROP_2[t.name], PROP_3[t.name]];
    return (_jsx(View, { style: [a.h_full, { marginHorizontal: tokens.space.xl * -1 }], children: _jsx(PagerView, { ref: ref, style: [a.flex_1], initialPage: step, onPageSelected: function (evt) {
                var page = evt.nativeEvent.position;
                if (step !== page) {
                    setActivePage(page);
                    setStep(page);
                }
            }, children: [0, 1, 2].map(function (page) { return (_jsx(Page, { page: page, image: images[page], avatarUri: avatarUri }, page)); }) }) }));
}
function Page(_a) {
    var page = _a.page, image = _a.image, avatarUri = _a.avatarUri;
    var _ = useLingui()._;
    var t = useTheme();
    var _b = useValuePropText(page), title = _b.title, description = _b.description, alt = _b.alt;
    return (_jsxs(View, { children: [_jsxs(View, { style: [
                    a.relative,
                    a.align_center,
                    a.justify_center,
                    a.pointer_events_none,
                ], children: [_jsx(Image, { source: image, style: [a.w_full, a.aspect_square], alt: alt, accessibilityIgnoresInvertColors: false }), page === 1 && (_jsx(Image, { source: avatarUri, style: [
                            a.z_10,
                            a.absolute,
                            a.rounded_full,
                            {
                                width: "".concat((80 / 393) * 100, "%"),
                                height: "".concat((80 / 393) * 100, "%"),
                            },
                        ], accessibilityIgnoresInvertColors: true, alt: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Your profile picture"], ["Your profile picture"])))) }))] }), _jsxs(View, { style: [a.mt_4xl, a.gap_2xl, a.px_xl, a.align_center], children: [_jsxs(View, { style: [a.flex_row, a.gap_sm], children: [_jsx(Dot, { active: page === 0 }), _jsx(Dot, { active: page === 1 }), _jsx(Dot, { active: page === 2 })] }), _jsxs(View, { style: [a.gap_sm], children: [_jsx(Text, { style: [a.font_bold, a.text_3xl, a.text_center], children: title }), _jsx(Text, { style: [
                                    t.atoms.text_contrast_medium,
                                    a.text_md,
                                    a.leading_snug,
                                    a.text_center,
                                ], children: description })] })] })] }, page));
}
var templateObject_1;
