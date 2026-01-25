var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View } from 'react-native';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { atoms as a, useTheme } from '#/alf';
import { Button } from '#/components/Button';
import { EyeSlash_Stroke2_Corner0_Rounded as EyeSlash } from '#/components/icons/EyeSlash';
import { Text } from '#/components/Typography';
import { useAnalytics } from '#/analytics';
export function ThreadItemShowOtherReplies(_a) {
    var onPress = _a.onPress;
    var t = useTheme();
    var ax = useAnalytics();
    var _ = useLingui()._;
    var label = _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Show more replies"], ["Show more replies"]))));
    return (_jsx(Button, { onPress: function () {
            onPress();
            ax.metric('thread:click:showOtherReplies', {});
        }, label: label, children: function (_a) {
            var hovered = _a.hovered, pressed = _a.pressed;
            return (_jsxs(View, { style: [
                    a.flex_1,
                    a.flex_row,
                    a.align_center,
                    a.gap_sm,
                    a.py_lg,
                    a.px_xl,
                    a.border_t,
                    t.atoms.border_contrast_low,
                    hovered || pressed ? t.atoms.bg_contrast_25 : t.atoms.bg,
                ], children: [_jsx(View, { style: [
                            t.atoms.bg_contrast_25,
                            a.align_center,
                            a.justify_center,
                            {
                                width: 26,
                                height: 26,
                                borderRadius: 13,
                                marginRight: 4,
                            },
                        ], children: _jsx(EyeSlash, { size: "sm", fill: t.atoms.text_contrast_medium.color }) }), _jsx(Text, { style: [t.atoms.text_contrast_medium, a.flex_1, a.leading_snug], numberOfLines: 1, children: label })] }));
        } }));
}
var templateObject_1;
