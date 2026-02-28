var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { atoms as a, useTheme } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as ArrowRotateIcon } from '#/components/icons/ArrowRotate';
import { MediaInsetBorder } from '#/components/MediaInsetBorder';
import { Text as TypoText } from '#/components/Typography';
export function Container(_a) {
    var children = _a.children;
    var t = useTheme();
    return (_jsxs(View, { style: [
            a.flex_1,
            t.atoms.bg_contrast_25,
            a.justify_center,
            a.align_center,
            a.px_lg,
            a.rounded_md,
            a.overflow_hidden,
            a.gap_lg,
        ], children: [children, _jsx(MediaInsetBorder, {})] }));
}
export function Text(_a) {
    var children = _a.children;
    var t = useTheme();
    return (_jsx(TypoText, { style: [
            a.text_center,
            t.atoms.text_contrast_high,
            a.text_md,
            a.leading_snug,
            { maxWidth: 300 },
        ], children: children }));
}
export function RetryButton(_a) {
    var onPress = _a.onPress;
    var _ = useLingui()._;
    return (_jsxs(Button, { onPress: onPress, size: "small", color: "secondary_inverted", label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Retry"], ["Retry"])))), children: [_jsx(ButtonIcon, { icon: ArrowRotateIcon }), _jsx(ButtonText, { children: _jsx(Trans, { children: "Retry" }) })] }));
}
var templateObject_1;
